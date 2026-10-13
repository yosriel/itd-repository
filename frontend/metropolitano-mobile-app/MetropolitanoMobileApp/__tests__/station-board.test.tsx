import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { StationBoard } from '../src/StationBoard';

test('station countdown advances, resets on station change and stops when closed', async () => {
  jest.useFakeTimers();
  const intervals = jest.spyOn(globalThis, 'setInterval');
  const clear = jest.spyOn(globalThis, 'clearInterval');
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => { tree = Renderer.create(<StationBoard station="Naranjal" close={() => {}} />); });
  expect(JSON.stringify(tree.toJSON())).toContain('3:00');
  await act(async () => { jest.advanceTimersByTime(1000); });
  expect(JSON.stringify(tree.toJSON())).toContain('2:59');
  await act(async () => { tree.update(<StationBoard station="Izaguirre" close={() => {}} />); });
  expect(JSON.stringify(tree.toJSON())).toContain('3:00');
  const boardTimer = intervals.mock.results.at(-1)!.value;
  await act(async () => { tree.update(<StationBoard station={null} close={() => {}} />); });
  expect(clear).toHaveBeenCalledWith(boardTimer);
  await act(async () => { tree.unmount(); });
  jest.useRealTimers();
  intervals.mockRestore(); clear.mockRestore();
});

