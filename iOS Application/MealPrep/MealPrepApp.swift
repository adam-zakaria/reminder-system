import SwiftUI

@main
struct MealPrepApp: App {
    var stickyList: StickyData
    var dataManager: ExternalDataManager
    
    init() {
        stickyList = StickyData()
        dataManager = ExternalDataManager(stickyData: stickyList)
        UIApplication.shared.isIdleTimerDisabled = true // Disable idle timer
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
