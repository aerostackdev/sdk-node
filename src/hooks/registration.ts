import { BeforeRequestHook, Hooks, BeforeRequestContext } from "./types.js";

let globalProjectId: string | undefined;

/**
 * Set the project ID to be used for all requests made by this SDK instance.
 * @param id The project UUID
 */
export function setProjectId(id: string) {
  globalProjectId = id;
}

class ProjectIdHook implements BeforeRequestHook {
  beforeRequest(_ctx: BeforeRequestContext, req: Request): Request {
    if (globalProjectId) {
      req.headers.set("X-Project-Id", globalProjectId);
    }
    return req;
  }
}

export function initHooks(hooks: Hooks) {
  const hook = new ProjectIdHook();
  hooks.registerBeforeRequestHook(hook);
}
