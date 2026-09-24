export function seatAvailability(driver) {
  const capacity = Number.isInteger(driver?.seatCapacity) && driver.seatCapacity > 0 ? driver.seatCapacity : null;
  const passengers = Number.isInteger(driver?.passengerCount) && driver.passengerCount >= 0 ? driver.passengerCount : null;
  const left = capacity !== null && passengers !== null ? Math.max(0, capacity - passengers) : null;
  return { capacity, passengers, left, full: left === 0 };
}
