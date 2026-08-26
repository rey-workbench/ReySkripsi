/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/// <reference types="office-js" />
import { AutoUpdater } from '@/core/services/system/auto-updater';
import { DictionaryService } from '@/core/services/dictionary/dictionary-service';
import { AppRouter } from '@/core/app-router';
import { AutoLanguageModule, BatchManualModule, AiChatbotModule, AutoCaptionModule, SettingsModule } from '@/modules/index';
import '@/taskpane/taskpane.css';

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    const appBody = document.getElementById("app-body");
    if (appBody) appBody.style.display = "block";
    
    const app = new AppRouter();
    
    app.register(new AutoCaptionModule());
    app.register(new AutoLanguageModule());
    app.register(new BatchManualModule());
    app.register(new AiChatbotModule());
    app.register(new SettingsModule());
    
    app.start();

    new AutoUpdater().start();

    DictionaryService.init().catch(() => {});
  }
});
