import { useEffect, useRef, useState } from 'react';
import { collection, doc, onSnapshot, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { readGuestRoutes, subscribeGuestRoutes, mutateGuestRoutes } from '../utils/guestSavedRoutes';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { ROUTES } from '../constants/routes';
import { savedRouteFields, writeSavedRoute } from '../utils/savedRoutes';

export function useSavedRoutes() {
  const { user } = useAuth();
  const uid = user?.uid ?? 'guest';
  const [state, setState] = useState({ uid: null, routes: [], loading: true, error: null });
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    if (!user) {
      let active = true;
      const refresh = () => readGuestRoutes().then((routes) => {
        if (active) setState({ uid, routes, loading: false, error: null });
      }).catch((error) => { if (active) setState({ uid, routes: [], loading: false, error }); });
      refresh();
      const unsubscribe = subscribeGuestRoutes(refresh);
      return () => { active = false; unsubscribe(); };
    }
    let active = true;
    setState({ uid, routes: [], loading: true, error: null });
    const unsubscribe = onSnapshot(query(collection(db, 'savedRoutes'), where('commuterId', '==', uid)),
      (snapshot) => {
        if (active) setState({ uid, routes: snapshot.docs.map((item) => ({ ...item.data(), id: item.id })), loading: false, error: null });
      },
      (error) => {
        if (active) setState({ uid, routes: [], loading: false, error });
      });
    return () => { active = false; unsubscribe(); };
  }, [uid, user, retry]);

  async function mutate(action, value) {
    if (lock.current) throw new Error('Please wait for your previous change to finish.');
    if (state.uid !== uid || state.loading || state.error) throw new Error('Wait for your saved routes to load, then try again.');
    const fields = action === 'delete' ? null : savedRouteFields(value, ROUTES.map((route) => route.id));
    const id = action === 'create' ? `${uid}_${fields.routeId}` : value.id;
    if (!id || id.includes('/')) throw new Error('Invalid saved route.');
    lock.current = true;
    setBusy(true);
    try {
      if (!user) {
        await mutateGuestRoutes(action, action === 'delete' ? value : { ...fields, id: value.id });
        return;
      }
      await runTransaction(db, async (transaction) => {
        const ref = doc(db, 'savedRoutes', id);
        const snapshot = await transaction.get(ref);
        writeSavedRoute(transaction, ref, snapshot, { action, uid, fields, timestamp: serverTimestamp() });
      });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return {
    routes: state.uid === uid ? state.routes : [],
    loading: Boolean(uid) && (state.uid !== uid || state.loading),
    error: state.uid === uid ? state.error : null,
    busy,
    retry: () => setRetry((value) => value + 1),
    create: (value) => mutate('create', value),
    update: (value) => mutate('update', value),
    remove: (value) => mutate('delete', value),
  };
}
