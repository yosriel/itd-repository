import fixtures from '../src/data/fixtures.json';
import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { StationBoard } from '../src/StationBoard';

test('station countdown advances, resets on station change and stops when closed', () => {
  jest.useFakeTimers();
  const intervals = jest.spyOn(globalThis, 'setInterval');
  const clear = jest.spyOn(globalThis, 'clearInterval');
  let tree!: Renderer.ReactTestRenderer;
  try {
    act(() => { tree = Renderer.create(<StationBoard routes={fixtures.rutas} station="Naranjal" close={() => {}} />); });
    expect(JSON.stringify(tree.toJSON())).toContain('3:00');
    act(() => { jest.advanceTimersByTime(1000); });
    expect(JSON.stringify(tree.toJSON())).toContain('2:59');
    act(() => { tree.update(<StationBoard routes={fixtures.rutas} station="Izaguirre" close={() => {}} />); });
    expect(JSON.stringify(tree.toJSON())).toContain('3:00');
    const boardTimer = intervals.mock.results.at(-1)!.value;
    act(() => { tree.update(<StationBoard routes={fixtures.rutas} station={null} close={() => {}} />); });
    expect(clear).toHaveBeenCalledWith(boardTimer);
  } finally {
    if (tree!) { act(() => { tree.unmount(); }); }
    jest.useRealTimers();
    intervals.mockRestore();
    clear.mockRestore();
  }
});
