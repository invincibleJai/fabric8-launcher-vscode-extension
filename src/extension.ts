'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Catalog } from './Catalog';
import * as zip from 'adm-zip'

let catalogBuilder:Catalog = new Catalog("https://forge.api.openshift.io/api");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('fabric8.launcher.generate', () => generate());

    context.subscriptions.push(disposable);
}

async function generate() {
    try {
        let catalog = await catalogBuilder.getCatalog();
        let missionId:any = await vscode.window.showQuickPick(catalog.missions.map((mission:any) => ({label: mission.id, description:mission.description})), {placeHolder: 'Choose mission'});
        if (missionId) {
            let boosters = catalog.boosters.filter((item:any) => item.mission == missionId.label);
            if (boosters) {
                let runtimeId:any = await vscode.window.showQuickPick(boosters.map((item:any) => ({label:item.runtime, description:item.version})),{placeHolder: 'Choose runtime'});
                if (runtimeId) {
                    let groupId = await vscode.window.showInputBox({prompt:'Group Id', placeHolder:'Enter the group id'});
                    if (groupId) {
                        let artifactId = await vscode.window.showInputBox({prompt:'Artifact Id', placeHolder:'Enter the artifact id'});
                        if (artifactId) {
                            let version = await vscode.window.showInputBox({prompt:'Version',placeHolder:'Enter the version'});
                            if (version) {
                                vscode.window.setStatusBarMessage("Downloading zip project file", 1000);
                                let zipProject = await catalogBuilder.zip(artifactId, missionId.label, runtimeId.label, runtimeId.description, groupId, artifactId, version);
                                if (zipProject) {
                                    let folder = await vscode.window.showWorkspaceFolderPick({placeHolder:'Select the target workspace folder'});
                                    if (folder) {
                                        vscode.window.setStatusBarMessage("Unzipping project file", 1000);
                                        new zip(zipProject as Buffer).extractAllToAsync(folder.uri.fsPath, false, (error) => {
                                            if (error) {
                                                vscode.window.showErrorMessage("Error while unzipping to " + folder!.uri.fsPath);
                                            } else {
                                                vscode.window.showInformationMessage("Project saved to " + folder!.uri.fsPath);
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    catch (error) {
        vscode.window.showErrorMessage("Error while processing Fabric8 launcher");
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}