/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/// <reference types="office-js" />
import { AutoUpdater } from '../core/services/auto-updater';
import { AppRouter } from '../core/app-router';
import { AutoLanguageModule } from '../modules/auto-language/auto-language';
import { BatchManualModule } from '../modules/batch-manual/batch-manual';
import './taskpane.css';

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    const appBody = document.getElementById("app-body");
    if (appBody) appBody.style.display = "block";
    
    const app = new AppRouter();
    
    // Register Modules (SRP: AppRouter handles UI generation and bindings)
    app.register(new AutoLanguageModule());
    app.register(new BatchManualModule());
    
    // Boot up the application
    app.start();

    // Start Auto Updater polling
    new AutoUpdater().start();
  }
});
