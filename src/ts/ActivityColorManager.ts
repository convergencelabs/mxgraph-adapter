import {ColorAssigner} from "@convergence/color-assigner";
import {
  Activity,
  ActivitySessionJoinedEvent,
  ActivitySessionLeftEvent,
  IConvergenceEvent
} from "@convergence/convergence";
import {filter} from "rxjs/operators";

export class ActivityColorManager {

  private readonly _colorAssigner: ColorAssigner;

  constructor(activity: Activity, palette?: string[]) {
    this._colorAssigner = new ColorAssigner(palette);

    activity.events()
      .pipe(filter((e: IConvergenceEvent) => e.name === "session_joined"))
      .subscribe((e: ActivitySessionJoinedEvent) => {
        this._addSession(e.sessionId);
      });

    activity.events()
      .pipe(filter((e: IConvergenceEvent) => e.name === "session_left"))
      .subscribe((e: ActivitySessionLeftEvent) => {
        this._removeSession(e.sessionId);
      });
  }

  public color(sessionId: string): string {
    return this._colorAssigner.getColorAsHex(sessionId);
  }

  private _addSession(sessionId: string): void {
    this._colorAssigner.getColor(sessionId);
  }

  private _removeSession(sessionId: string): void {
    this._colorAssigner.releaseColor(sessionId);
  }
}
