//
//  ContentView.swift
//  MealPrep
//
//  Created by Jiachen Li on 5/16/23.
//

import SwiftUI
import NWWebSocket

struct ContentView: View {
    @Environment(\.scenePhase) var scenePhase
    
    var dataManager : ExternalDataManager
    
    @State var user = User(name: "Sam")
    
    @State var isActive : Bool = false
    @State var showingArchive = false
    @State var showingAddSticky = false
    @State var animationFlag:Int = 0
    
//  @State var showingTest = false
    
    @EnvironmentObject var stickyList: StickyData
    @Environment(\.mainWindowSize) var mainWindowSize

//NOT using testing parameters
//    @Binding var new_sticky: Sticky
//    @ObservedObject var stickyList = StickyData()
//    @EnvironmentObject var stickyList: StickyData
//    @EnvironmentObject var stickyList: StickyData
//    @State private var path = NavigationPath()

    //@Binding var stickyList_new: StickyData
//    @StateObject var stickyList1 = StickyData1(initList: [
//            Sticky(title:"Title1", content: "content1"),
//            Sticky(title:"Title2", content: "content2"),
//            Sticky(title:"Title2", content: "content2", instructions: [
//                Instruction(name:"Walk to Stove"),
//                Instruction(name:"Turn off Stove")
//                ])])
//    @StateObject var stickyList2 = StickyData1(initList: [
//            Sticky(title:"Archive1", content: "acontent1", finished: true)
//            ])
    
    //@State var column_num = Double()
    //var column_num = Int(floor(Double((Int(UIScreen.screenWidth)-100)/200)))
    //we need to modify this part later to make the layout more flexible
    //var layout = Array(repeating:  GridItem(.flexible()),count:Int((UIScreen.screenWidth-100)/200))
//    var layout = [
//        GridItem(.flexible()),
//        GridItem(.flexible()),
//        GridItem(.flexible())
//    ]
    var body: some View {
        //this is built for ios 16, if we are using lower version, need some modifications
        NavigationStack() {
            //ScrollView{
                GeometryReader { geometry in
                    //Add background color/texture
                    ZStack{
                        Image("background_texture")
                        .resizable()
                        .scaledToFill()
                        .edgesIgnoringSafeArea(.all)
                    }
                    //root stack
                    VStack(alignment:.leading, spacing: 0){
                        if (stickyList.connected)
                        {
                            if (stickyList.tutorial_mode)
                            {
                                Button(action: {
                                    stickyList.completedTutorial()
                                    showingArchive = false
                                }, label: {
                                    Text("Completed Tutorial")
                                })
                            }
                        }
                        else
                        {
                            Text("Not Connected to Server")
                                .foregroundColor(.red)
                        }
                        //time title stack
                        HStack(spacing:20){
                            Text(getTime())
                                .font(.system(size: 100))
                                .bold()
                            Rectangle()
                                .fill(Color.black)
                                .frame(width: 6.0,height:90)
                            VStack(alignment:.leading){
                                Text(getDayname())
                                    .font(.system(size: 40))
                                Text(getDate())
                                    .font(.system(size: 40))
                            }
                        }
                        .foregroundColor(.black)
                        (Text("\(self.stickyList.archive_stickyNotes.count) ")
                                .foregroundColor(.green)
                                .font(.system(size: 35))
                                .fontWeight(.heavy)
                        +
                        Text("out of ")
                            .foregroundColor(.black)
                        +
                        Text("\(self.stickyList.active_stickyNotes.count+self.stickyList.archive_stickyNotes.count) ")
                            .fontWeight(.heavy)
                            .foregroundColor(.black)
                        +
                        Text("of today's tasks completed!"))
                            .padding(.horizontal)
                            .font(.system(size: 25))
                            .foregroundColor(.black)
                        
                        //stickies stack
                        if(showingArchive){
                            // showing archive
                            HStack{
                                Button(action:{
                                    showingArchive = false
                                    print("Back to home")
                                    //print(UIScreen.screenWidth)
                                }){
                                    (Text(Image(systemName: "arrow.left"))+Text("  Back to Home"))
                                        .padding(.horizontal)
                                        .padding(.vertical,5)
                                        .font(.system( size: 30))
                                        .bold()
                                        .foregroundColor(.white)
                                }
                                .background(Color.green)
                                .cornerRadius(15)
                                .padding(.horizontal)
                                Spacer()
                            }
                            ScrollView{
                                LazyVGrid(columns: getLayout(width:Int(mainWindowSize.width)), spacing: 20) {
                                    ForEach(self.stickyList.archive_stickyNotes) { sticky in
                                        stickyCard(sticky: sticky)
                                            
                                        
                                    }
                                    
                                }
                                .padding()
                            }
                            .mask(
                                LinearGradient(gradient: Gradient(colors: [Color.black, Color.black.opacity(0)]), startPoint: UnitPoint(x: 0, y: 0.04), endPoint: UnitPoint(x: 0, y: 0))
                            )
                            //animation to all stickies
                            .animation(.spring(response: 0.4, dampingFraction: 0.6),value:self.stickyList.active_stickyNotes.count)
                            
                        }
                        else{
                            // showing active
                            HStack{
                                if (stickyList.archive_stickyNotes.count > 0)
                                {
                                    Button(action:{
                                        showingArchive = true
                                        print("Show Finished")
                                        //print(UIScreen.screenWidth)
                                    }){
                                        (Text("Show Finished  ")+Text(Image(systemName: "arrow.right")))
                                            .padding(.horizontal)
                                            .padding(.vertical,5)
                                            .font(.system( size: 30))
                                            .bold()
                                            .foregroundColor(.white)
                                    }
                                    .background(Color.green)
                                    .cornerRadius(15)
                                    .padding(.horizontal)
                                    Spacer()
                                }
                                else
                                {
                                    Spacer()
                                        .padding(.vertical, 22)
                                }
                            }
                            ScrollView{
                                LazyVGrid(columns: getLayout(width:Int(mainWindowSize.width)), spacing: 20) {
                                    ForEach(self.stickyList.active_stickyNotes) { sticky in
                                        stickyCard(sticky: sticky)
                                        
                                    }
                                }
                                .padding()
                            }
                            .mask(
                                LinearGradient(gradient: Gradient(colors: [Color.black, Color.black.opacity(0)]), startPoint: UnitPoint(x: 0, y: 0.04), endPoint: UnitPoint(x: 0, y: 0))
                            )
                            //animation to all stickies
                            .animation(.spring(response: 0.4, dampingFraction: 0.6),value:self.stickyList.active_stickyNotes.count)
                        }
                    }
                    
//                    //add floating sticky button
//                    .floatingActionButton(color: .blue,text:"Add new sticky") {
//                        print("add")
//                        showingAddSticky=true
//                    }
                    .padding()
                    .navigationDestination(isPresented: $showingAddSticky) {
                        addStickyView()
                    }

            }
        }
        .onChange(of: scenePhase, perform: { newPhase in
            if newPhase == .active
            {
                self.dataManager.connect_and_initialize()
            }
            if newPhase == .background
            {
                print("disconnecting because app going into background")
                self.dataManager.disconnect()
            }
        })
    }
}

//Time formatting
func getTime() -> String {
    let formatter = DateFormatter()
    formatter.timeStyle = .short
    let dateString = formatter.string(from: Date())
    return dateString
}
func getDayname() -> String {
    let meetingDate = Date() // Feb 18, 2021 at 3:00 PM
    return  meetingDate.formatted(Date.FormatStyle().weekday(.wide)) // Thursday
}
func getDate() -> String {
    let meetingDate = Date() // Feb 18, 2021 at 3:00 PM
    let date=meetingDate.formatted(Date.FormatStyle().month(.abbreviated))+" "+meetingDate.formatted(Date.FormatStyle().day(.defaultDigits))+" "+meetingDate.formatted(Date.FormatStyle().year(.defaultDigits))
    return  date
}


//Dynamic layout
func getLayout(width:Int) -> Array<GridItem> {
    var column_num = Int((width-100)/300)
    //print(column_num)
    var layout : [GridItem] = Array(repeating: .init(.flexible(),spacing: 30), count: column_num)
    return layout
}


private struct MainWindowSizeKey: EnvironmentKey {
    static let defaultValue: CGSize = .zero
}

extension EnvironmentValues {
    var mainWindowSize: CGSize {
        get { self[MainWindowSizeKey.self] }
        set { self[MainWindowSizeKey.self] = newValue }
    }
}

//FAB Button
struct FloatingActionButton: ViewModifier {
    let color: Color // background color of the FAB
    let text: String
    let action: () -> Void
    
    private let size: CGFloat = 60 // size of the FAB circle
    private let margin: CGFloat = 15 // distance from screen edges
    
    func body(content: Content) -> some View {
        GeometryReader { geo in
            ZStack {
                Color.clear // allows the ZStack to fill the entire screen
            content
            button(geo)
          }
        }
    }
    @ViewBuilder private func button(_ geo: GeometryProxy) -> some View {
        HStack{
                //              image
                //                  .imageScale(.large)
                //                  .frame(width: size, height: size)
                //                  .background(Circle().fill(color))
                //                  .shadow(color: .gray, radius: 2, x: 1, y: 1)
                //                  .onTapGesture(perform: action)
                //                  .offset(x: (geo.size.width - size) / 2 - margin,
                //                          y: (geo.size.height - size) / 2 - margin)
            (Text(Image(systemName: "plus")) + Text("  ") + Text(text))
                .padding()
                .background(Color("stickyYellow"))
                .cornerRadius(5, corners: [.topLeft, .topRight])
                .padding(.horizontal)
                .font(.system( size: 30))
                .foregroundColor(.black)
                .shadow(color: .gray, radius: 5, x: 6, y: 2)
                .bold()
                .offset(x: (geo.size.width - size) / 2-120 ,y: (geo.size.height - size) / 2 )
                .onTapGesture(perform: action)
        }
  }
}
extension View {
  func floatingActionButton(
    color: Color,
    text:   String,
    action: @escaping () -> Void) -> some View {
    self.modifier(FloatingActionButton(color: color,
                                       text: text,
                                       action: action))
  }
}
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape( RoundedCorner(radius: radius, corners: corners) )
    }
}
struct RoundedCorner: Shape {

    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(roundedRect: rect, byRoundingCorners: corners, cornerRadii: CGSize(width: radius, height: radius))
        return Path(path.cgPath)
    }
}

//***********PREVIEW*****************
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        let stickyList = StickyData()
        let dataManager = ExternalDataManager(stickyData: stickyList)
        ContentView(dataManager:dataManager)
            .environmentObject(stickyList)
    }
}


//***********NOT USING*****************
extension UIScreen{
   static let screenWidth = UIScreen.main.bounds.size.width
   static let screenHeight = UIScreen.main.bounds.size.height
   static let screenSize = UIScreen.main.bounds.size
}
// Our custom view modifier to track rotation and
// call our action
struct DeviceRotationViewModifier: ViewModifier {
    let action: (UIDeviceOrientation) -> Void

    func body(content: Content) -> some View {
        content
            .onAppear()
            .onReceive(NotificationCenter.default.publisher(for: UIDevice.orientationDidChangeNotification)) { _ in
                action(UIDevice.current.orientation)
            }
    }
}

// A View wrapper to make the modifier easier to use
extension View {
    func onRotate(perform action: @escaping (UIDeviceOrientation) -> Void) -> some View {
        self.modifier(DeviceRotationViewModifier(action: action))
    }
}

struct NavigationLazyView<Content: View>: View {
    let build: () -> Content
    init(_ build: @autoclosure @escaping () -> Content) {
        self.build = build
    }
    var body: Content {
        build()
    }
}




