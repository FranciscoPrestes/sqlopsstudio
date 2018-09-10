/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from 'vs/platform/registry/common/platform';
import { IWorkbenchActionRegistry, Extensions } from 'vs/workbench/common/actions';
import { SyncActionDescriptor } from 'vs/platform/actions/common/actions';
import { Action } from 'vs/base/common/actions';
import { TPromise } from 'vs/base/common/winjs.base';
import { IConnectionManagementService, IConnectionCompletionOptions, INewConnectionParams, ConnectionType, RunQueryOnConnectionMode } from 'sql/parts/connection/common/connectionManagement';
import { ICapabilitiesService } from 'sql/services/capabilities/capabilitiesService';
import { ConnectionProfile } from 'sql/parts/connection/common/connectionProfile';
import { IQueryEditorService } from 'sql/parts/query/common/queryEditorService';
import { IObjectExplorerService } from 'sql/parts/objectExplorer/common/objectExplorerService';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService';
import * as TaskUtilities from 'sql/workbench/common/taskUtilities';

export class StressWorkload1 extends Action {

	public static ID = 'StressWorkload1';
	public static LABEL = 'Stress Workload 1';
	public static ICON = 'search-action clear-search-results';

	constructor(
		id: string,
		label: string,
		@IConnectionManagementService private _connectionManagementService: IConnectionManagementService,
		@ICapabilitiesService private _capabilitiesService: ICapabilitiesService,
		@IQueryEditorService protected _queryEditorService: IQueryEditorService,
		@IObjectExplorerService protected _objectExplorerService: IObjectExplorerService,
		@IEditorService protected _workbenchEditorService: IEditorService
	) {
		super(id, label, StressWorkload1.ICON);
		this.enabled = true;
	}

	public run(): TPromise<void> {

		let uri: string = 'stress://testconnection1';

		let params: INewConnectionParams = {
			connectionType: ConnectionType.default
		};

		let options: IConnectionCompletionOptions = {
			params: params,
			saveTheConnection: true,
			showDashboard: false,
			showConnectionDialogOnError: false,
			showFirewallRuleOnError: false
		};

		let providerName = 'MSSQL';
		let newProfile = new ConnectionProfile(this._capabilitiesService, providerName);
		newProfile.saveProfile = true;
		newProfile.generateNewId();
		newProfile.saveProfile = false;
		newProfile.serverName = 'localhost,1401';
		newProfile.databaseName = 'master';
		newProfile.userName = 'sa';
		newProfile.password = 'Sql2017isfast';

		let self = this;
		this._connectionManagementService.connectAndSaveProfile(newProfile, uri, options, params && params.input).then(connectionResult => {
			self.createQueryEditors(10, newProfile);
		}).catch(err => {
		});

		return undefined;
	}

	public createQueryEditors(editors: number, profile: ConnectionProfile) {
		this.newQueryEditorStep(profile);
		if (editors > 0) {
			setTimeout(() => {
				this.createQueryEditors(editors-1, profile);
			}, 5000);
		}
	}

	public newQueryEditorStep(profile: ConnectionProfile): TPromise<boolean> {
		return new TPromise<boolean>((resolve, reject) => {
			TaskUtilities.newQuery(
				profile,
				this._connectionManagementService,
				this._queryEditorService,
				this._objectExplorerService,
				this._workbenchEditorService,
				'SELECT * FROM SYS.OBJECTS',
				RunQueryOnConnectionMode.executeQuery
			).then(() => resolve(true), () => resolve(false));
		});
	}
}

let actionRegistry = <IWorkbenchActionRegistry>Registry.as(Extensions.WorkbenchActions);

actionRegistry.registerWorkbenchAction(
	new SyncActionDescriptor(
		StressWorkload1,
		StressWorkload1.ID,
		StressWorkload1.LABEL
	),
	StressWorkload1.LABEL
);
