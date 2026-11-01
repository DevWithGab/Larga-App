import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: Layout } = await server.ssrLoadModule('/src/components/CommuterLayout.jsx');
  for (const collapsed of [false, true]) {
    globalThis.localStorage = { getItem: () => collapsed ? '1' : '0' };
    for (const path of ['/map', '/routes', '/saved-routes', '/alerts', '/profile']) {
      const html = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(Layout)));
      const links = [...html.matchAll(/<a\b[^>]*href="\/(?:map|routes|saved-routes|alerts|profile)"[^>]*>/g)].map(([tag]) => tag);
      assert.equal(links.length, 5, 'All commuter destinations must render');
      for (const link of links) {
        const classes = link.match(/class="([^"]*)"/)?.[1] || '';
        assert.ok(classes.includes('flex'), `Navigation layout classes missing: ${link}`);
        assert.ok(!classes.includes('=&gt;') && !classes.includes('isActive'), 'A className callback must not be serialized by Radix Slot');
      }
      assert.equal(links.filter((link) => link.includes('aria-current="page"')).length, 1);
      assert.ok(links.find((link) => link.includes(`href="${path}"`)).includes('bg-primary'), 'Current destination must have its orange active state');
    }
  }
  console.log('Navigation checks passed for all five tabs, expanded and collapsed.');
} finally {
  delete globalThis.localStorage;
  await server.close();
}
