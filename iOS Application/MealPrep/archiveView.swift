//
//  archiveView.swift
//  MealPrep
//
//  Created by Jiachen Li on 5/17/23.
//


//this is not used for now
//we only need this view if we want the archive to be a separate view
import SwiftUI

struct archiveView: View {
    @State var showingHome = false
    //@StateObject var stickyList = StickyData(initList: [])
    var layout = [
            GridItem(.flexible()),
            GridItem(.flexible()),
            GridItem(.flexible())
        ]
    var body: some View {

        //this is built for ios 16
        NavigationStack {
            ScrollView{
                GeometryReader { geometry in
                    //parent stack
                    VStack(alignment:.leading){}
                    .padding()
                }
                
            }
            .navigationDestination(isPresented: $showingHome) {
                ContentView(dataManager:ExternalDataManager())
                
            }
        }
    }
}

struct archiveView_Previews: PreviewProvider {
    static var previews: some View {
        archiveView()
    }
}
