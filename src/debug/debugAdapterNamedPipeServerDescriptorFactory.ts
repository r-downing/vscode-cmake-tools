import { extensionManager } from "@cmt/extension";
import * as vscode from "vscode";
import { DebuggerInformation, getDebuggerPipeName } from "./debuggerConfigureDriver";
export class DebugAdapterNamedPipeServerDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {
    async createDebugAdapterDescriptor(session: vscode.DebugSession, _executable: vscode.DebugAdapterExecutable | undefined): Promise<vscode.ProviderResult<vscode.DebugAdapterDescriptor>> {
        // first invoke cmake
        // invoke internal methods that call into and maybe have a handler once we've got the debugger is ready
        const debuggerPipeName = session.configuration.debuggerPipeName ?? getDebuggerPipeName();
        const debuggerInformation: DebuggerInformation = {
            debuggerPipeName,
            debuggerDapLog: session.configuration.debuggerDapLog,
            debuggerIsReady: () => undefined
        };

        // undocumented configuration field that lets us know if the session is being invoked from a command
        // This should only be used from inside the extension from a command that invokes the debugger.
        if (!session.configuration.fromCommand) {
            if (session.configuration.request === "launch") {
                const promise = new Promise<void>((resolve) => {
                    debuggerInformation.debuggerIsReady = resolve;
                });

                if (session.configuration.script) {
                    debuggerInformation.debuggerIsReady?.();
                } else {
                    if (session.configuration.cleanConfigure) {
                        if (session.configuration.configureAll) {
                            void extensionManager?.cleanConfigureAllWithDebuggerInternal(
                                debuggerInformation
                            );
                        } else {
                            void extensionManager?.cleanConfigureWithDebuggerInternal(
                                debuggerInformation
                            );
                        }
                    } else {
                        if (session.configuration.configureAll) {
                            void extensionManager?.configureAllWithDebuggerInternal(
                                debuggerInformation
                            );
                        } else {
                            void extensionManager?.configureWithDebuggerInternal(
                                debuggerInformation
                            );
                        }
                    }
                }

                await promise;
            } else if (session.configuration.request === "attach") {
                if (session.configuration.debuggerPipeName === undefined) {
                    throw new Error("debuggerPipeName undefined");
                }
            }
        }

        return new vscode.DebugAdapterNamedPipeServer(
            debuggerPipeName
        );
    }
}
