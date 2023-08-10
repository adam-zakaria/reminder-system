//
//  MealPrepApp.swift
//  MealPrep
//
//  Created by Jiachen Li on 5/16/23.
//

import SwiftUI

@main
struct MealPrepApp: App {
    var stickyList: StickyData
    var dataManager : ExternalDataManager
    
    init()
    {
        UIApplication.shared.isIdleTimerDisabled = true
        stickyList = StickyData()
        dataManager = ExternalDataManager(stickyData: stickyList)
    }
    
    
    var body: some Scene {
        WindowGroup {
            GeometryReader { proxy in
                ContentView(dataManager: dataManager)
                    .environment(\.mainWindowSize, proxy.size)
                    .environmentObject(stickyList)
            }
            .statusBarHidden(true)
        }
    }
}
