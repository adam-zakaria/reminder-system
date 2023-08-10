//
//  addView.swift
//  MealPrep
//
//  Created by Jiachen Li on 5/22/23.
//

//View for add stickies
import SwiftUI

struct addView: View {
    @Environment(\.presentationMode) var presentationMode
    @EnvironmentObject var stickyList: StickyData
    //important! this array is to store the original stickyList before it gets initiated again
    @StateObject private var stickyList_store = StickyData()

    @State private var title: String = ""
    @State private var content: String = ""

    @State var doneAdding = false
    //on iPad and simulator, you need to press ENTER after typing words, or it will return wrong strings
    @State var complete_title = false
    @State var complete_content = false

//    @State var showWarning = false
    
//    @Binding var path: NavigationPath
//    @Binding var stickyList1: StickyData
//    @Binding var new_sticky:Sticky
//    @EnvironmentObject var stickyList: StickyData
//    init(active_stickyNotes: [Sticky],archive_stickyNotes:[Sticky]) {
//        _stickyList_store = StateObject(wrappedValue: StickyData(active_stickyNotes:self.stickyList.active_stickyNotes,archive_stickyNotes:self.stickyList.archive_stickyNotes))
//        }
//    @AppStorage("items") var items: [[String]] = [
//           ["1", "2"],
//           ["a", "b", "c"],
//       ]
    var body: some View {
        NavigationStack () {
            GeometryReader { geometry in
                //Add background color/texture
                ZStack{
                    Image("background_texture")
                        .resizable()
                        .scaledToFill()
                        .edgesIgnoringSafeArea(.all)
                }
                VStack{
                    HStack{
                        Text("Title:")
                        TextField(
                            "title",
                            text: $title,
                            onCommit: {
                                complete_title=true
                            }
                        )
                    }
                    HStack{
                        Text("Content:")
                        TextField(
                            "Content",
                            text: $content,
                            onCommit: {
                                complete_content=true
                            }
                        )
                    }
                    Button("Done"){
                        if(complete_title && complete_content){
                            
                            stickyList_store.active_stickyNotes.append(Sticky(title: title, content: content))
                            print("init in add view")
                            print(stickyList_store.active_stickyNotes.count)
                            self.stickyList.active_stickyNotes.removeAll()
                            self.stickyList.archive_stickyNotes.removeAll()
                            for sticky in stickyList_store.active_stickyNotes{
                                self.stickyList.active_stickyNotes.append(sticky)
                            }
                            for sticky in stickyList_store.archive_stickyNotes{
                                self.stickyList.archive_stickyNotes.append(sticky)
                            }
                            print("environment object now")
                            print(self.stickyList.active_stickyNotes.count)
                            doneAdding=true
                            //directly go to root view instead of creating a container view
                            presentationMode.wrappedValue.dismiss()
                            
                            
                        }
                        else{
                            print("empty field")
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .frame(maxWidth: 600)
                    .onAppear(){
                        //save the original array before it gets initiated
                        stickyList_store.active_stickyNotes=self.stickyList.active_stickyNotes
                        stickyList_store.archive_stickyNotes=self.stickyList.archive_stickyNotes
                        print("init in add view")
                        print(stickyList_store.active_stickyNotes.count)
                    }
                }
            }
        }
    }
}

struct addView_Previews: PreviewProvider {
    static var previews: some View {
        addView()
    }
}

//NOT Using
extension NavigationPath{
    mutating func popToRoot() {
        self = NavigationPath()
    }
}
extension Array: RawRepresentable where Element: Codable {
    public init?(rawValue: String) {
        guard let data = rawValue.data(using: .utf8),
              let result = try? JSONDecoder().decode([Element].self, from: data)
        else {
            return nil
        }
        self = result
    }

    public var rawValue: String {
        guard let data = try? JSONEncoder().encode(self),
              let result = String(data: data, encoding: .utf8)
        else {
            return "[]"
        }
        return result
    }
}

