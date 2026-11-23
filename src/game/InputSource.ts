import { ActionType } from '../engine/InputManager';

export interface IInputSource {
  isActionDown(action: ActionType): boolean;
  isActionJustPressed(action: ActionType): boolean;
  isActionJustReleased(action: ActionType): boolean;
  hasBufferedJump(): boolean;
  consumeBufferedJump(): void;
}
