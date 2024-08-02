import SwiftUI
import AVFoundation

struct ContentView: View {
    @Environment(\.scenePhase) var scenePhase

    @State private var showingURLChangeSheet = false
    @State private var newSocketURL = ""
    @State private var showHiddenButton = false
    @State private var showTestingButton = false

    var dataManager: ExternalDataManager

    @State var user = User(name: "Sam")

    @State var isActive: Bool = false
    @State var showingArchive = false
    @State var showingAddSticky = false
    @State var animationFlag = 0
    @State var showAlert = false
    @State var alertTitle = ""
    @State var alertMessage = ""
    @State var isTesting = false

    @EnvironmentObject var stickyList: StickyData
    @Environment(\.mainWindowSize) var mainWindowSize

    @StateObject private var viewModel = ContentViewModel()
    @StateObject private var bleManager = BLEManager()

    private let defaultSocketURL = "https://gateway.parcs.northeastern.edu/ai-caring/api/"

    var body: some View {
        NavigationStack {
            GeometryReader { geometry in
                VStack {
                    ZStack {
                        Image("background_texture")
                            .resizable()
                            .scaledToFill()
                            .edgesIgnoringSafeArea(.all)
                            .onTapGesture(count: 2) {
                                withAnimation {
                                    showHiddenButton.toggle()
                                    showTestingButton.toggle()
                                }
                            }

                        VStack(alignment: .leading, spacing: 0) {
                            // WebSocket Connection Status
                            HStack {
                                Text("WebSocket Status: ")
                                    .font(.headline)
                                Text(stickyList.connected ? "Connected" : "Disconnected")
                                    .font(.headline)
                                    .foregroundColor(stickyList.connected ? .green : .red)
                            }
                            .padding()
                            .background(Color.white.opacity(0.7))
                            .cornerRadius(10)
                            .padding(.top, 20)

                            if showHiddenButton {
                                VStack(alignment: .leading) {
                                    Button("Change WebSocket URL") {
                                        showingURLChangeSheet = true
                                    }
                                    .padding()
                                    .background(Color.orange)
                                    .foregroundColor(.white)
                                    .cornerRadius(10)
                                    .padding(.bottom, 10)

                                    if showTestingButton {
                                        Button(action: {
                                            isTesting.toggle()
                                            if isTesting {
                                                startTestingMode()
                                            } else {
                                                stopTestingMode()
                                            }
                                        }) {
                                            Text(isTesting ? "Stop Testing" : "Start Testing")
                                                .padding()
                                                .background(isTesting ? Color.red : Color.green)
                                                .foregroundColor(.white)
                                                .cornerRadius(10)
                                        }
                                        .padding(.bottom, 10)

                                        // Add the Test Sound Button
                                        Button(action: {
                                            testSystemSound()
                                        }) {
                                            Text("Test Sound")
                                                .padding()
                                                .background(Color.blue)
                                                .foregroundColor(.white)
                                                .cornerRadius(10)
                                        }
                                        .padding(.bottom, 10)
                                    }
                                }
                            }

                            if stickyList.connected {
                                if stickyList.tutorial_mode {
                                    Button(action: {
                                        stickyList.completedTutorial()
                                        showingArchive = false
                                    }, label: {
                                        Text("Completed Tutorial")
                                    })
                                }
                            } else {
                                Text("Not Connected to Server")
                                    .foregroundColor(.red)
                            }

                            HStack(spacing: 20) {
                                Text(getTime())
                                    .font(.system(size: 100))
                                    .bold()
                                Rectangle()
                                    .fill(Color.black)
                                    .frame(width: 6.0, height: 90)
                                VStack(alignment: .leading) {
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
                            Text("\(self.stickyList.active_stickyNotes.count + self.stickyList.archive_stickyNotes.count) ")
                                .fontWeight(.heavy)
                                .foregroundColor(.black)
                            +
                            Text("of today's tasks completed!"))
                                .padding(.horizontal)
                                .font(.system(size: 25))
                                .foregroundColor(.black)

                            if showingArchive {
                                HStack {
                                    Button(action: {
                                        showingArchive = false
                                        print("Back to home")
                                    }) {
                                        (Text(Image(systemName: "arrow.left")) + Text("  Back to Home"))
                                            .padding(.horizontal)
                                            .padding(.vertical, 5)
                                            .font(.system(size: 30))
                                            .bold()
                                            .foregroundColor(.white)
                                    }
                                    .background(Color.green)
                                    .cornerRadius(15)
                                    .padding(.horizontal)
                                    Spacer()
                                }
                                ScrollView {
                                    LazyVGrid(columns: getLayout(width: Int(mainWindowSize.width)), spacing: 20) {
                                        ForEach(self.stickyList.archive_stickyNotes) { sticky in
                                            stickyCard(sticky: sticky)
                                        }
                                    }
                                    .padding()
                                }
                                .mask(
                                    LinearGradient(gradient: Gradient(colors: [Color.black, Color.black.opacity(0)]), startPoint: UnitPoint(x: 0, y: 0.04), endPoint: UnitPoint(x: 0, y: 0))
                                )
                                .animation(.spring(response: 0.4, dampingFraction: 0.6), value: self.stickyList.active_stickyNotes.count)

                            } else {
                                HStack {
                                    if stickyList.archive_stickyNotes.count > 0 {
                                        Button(action: {
                                            showingArchive = true
                                            print("Show Finished")
                                        }) {
                                            (Text("Show Finished  ") + Text(Image(systemName: "arrow.right")))
                                                .padding(.horizontal)
                                                .padding(.vertical, 5)
                                                .font(.system(size: 30))
                                                .bold()
                                                .foregroundColor(.white)
                                        }
                                        .background(Color.green)
                                        .cornerRadius(15)
                                        .padding(.horizontal)
                                        Spacer()
                                    } else {
                                        Spacer()
                                            .padding(.vertical, 22)
                                    }
                                }
                                ScrollView {
                                    LazyVGrid(columns: getLayout(width: Int(mainWindowSize.width)), spacing: 20) {
                                        ForEach(self.stickyList.active_stickyNotes) { sticky in
                                            stickyCard(sticky: sticky)
                                        }
                                    }
                                    .padding()
                                }
                                .mask(
                                    LinearGradient(gradient: Gradient(colors: [Color.black, Color.black.opacity(0)]), startPoint: UnitPoint(x: 0, y: 0.04), endPoint: UnitPoint(x: 0, y: 0))
                                )
                                .animation(.spring(response: 0.4, dampingFraction: 0.6), value: self.stickyList.active_stickyNotes.count)
                            }

                            Spacer()
                        }
                        .padding()
                        .navigationDestination(isPresented: $showingAddSticky) {
                            addStickyView(notificationSoundId: 1007) // Pass the notificationSoundId from backend
                        }
                    }
                }
            }
        }
        .onAppear {
            bleManager.centralManagerDidUpdateState(bleManager.centralManager)
            viewModel.connectBLE()
            dataManager.connect_and_initialize()
        }
        .onChange(of: bleManager.isConnected) { isConnected in
            if isConnected {
                alertTitle = "Device Connected"
                alertMessage = "Successfully connected to the LED strip."
                showAlert = true
                if isTesting {
                    startTestingMode()
                }
            }
        }
        .onChange(of: bleManager.isDisconnected) { isDisconnected in
            if isDisconnected {
                alertTitle = "Device Disconnected"
                alertMessage = "Lost connection to the LED strip. Attempting to reconnect..."
                showAlert = true
            }
        }
        .onChange(of: scenePhase) { newPhase in
            if newPhase == .active {
                self.dataManager.connect_and_initialize()
                viewModel.connectBLE()
            }
            if newPhase == .background {
                print("disconnecting because app going into background")
                self.dataManager.disconnect()
            }
        }
        .alert(isPresented: $showAlert) {
            Alert(
                title: Text(alertTitle),
                message: Text(alertMessage),
                dismissButton: .default(Text("OK"))
            )
        }
        .sheet(isPresented: $showingURLChangeSheet) {
            VStack {
                Text("Current WebSocket URL")
                    .font(.headline)
                    .padding(.bottom, 2)
                Text(dataManager.socketURL?.absoluteString ?? "Unknown")
                    .font(.subheadline)
                    .padding()
                    .background(Color.gray.opacity(0.2))
                    .cornerRadius(10)
                    .padding(.bottom, 20)
                
                TextField("Enter new WebSocket URL", text: $newSocketURL)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.bottom, 20)
                
                HStack {
                    Button("Cancel") {
                        showingURLChangeSheet = false
                    }
                    .padding()
                    .background(Color.red)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    
                    Spacer()
                    
                    Button("Reset to Default") {
                        if let url = URL(string: defaultSocketURL) {
                            dataManager.changeSocketURL(newURL: url)
                        }
                        showingURLChangeSheet = false
                    }
                    .padding()
                    .background(Color.orange)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    
                    Spacer()
                    
                    Button("OK") {
                        if let url = URL(string: newSocketURL) {
                            dataManager.changeSocketURL(newURL: url)
                        }
                        showingURLChangeSheet = false
                    }
                    .padding()
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .padding(.horizontal)
            }
            .padding()
        }
    }

    func startTestingMode() {
        print("Starting testing mode.")
        DispatchQueue.global(qos: .background).async {
            while self.isTesting {
                if !self.bleManager.isConnected {
                    print("BLE is not connected. Exiting testing mode.")
                    return
                }

                for color in 1...7 {
                    if !self.isTesting {
                        print("Testing mode stopped.")
                        return
                    }
                    print("BLE is connected: \(self.bleManager.isConnected)")
                    print("Writing color value: \(color)")
                    self.bleManager.writeColor(value: color)
                    sleep(1)
                }

                for brightness in stride(from: 50, to: 256, by: 50) {
                    if !self.isTesting {
                        print("Testing mode stopped.")
                        return
                    }
                    print("BLE is connected: \(self.bleManager.isConnected)")
                    print("Writing brightness value: \(brightness)")
                    self.bleManager.writeBrightness(value: brightness)
                    sleep(1)
                }
            }
        }
    }

    func stopTestingMode() {
        print("Stopping testing mode.")
        isTesting = false
        DispatchQueue.global(qos: .background).async {
            self.bleManager.writeColor(value: 0)
            self.bleManager.writeBrightness(value: 0)
            print("Reset color and brightness values to 0.")
        }
    }

    func testSystemSound() {
        // Play the test sound, use a known sound ID like 1007
        AudioServicesPlaySystemSound(1007)
    }
}

// Time formatting
func getTime() -> String {
    let formatter = DateFormatter()
    formatter.timeStyle = .short
    let dateString = formatter.string(from: Date())
    return dateString
}

func getDayname() -> String {
    let meetingDate = Date()
    return meetingDate.formatted(Date.FormatStyle().weekday(.wide))
}

func getDate() -> String {
    let meetingDate = Date()
    let date = meetingDate.formatted(Date.FormatStyle().month(.abbreviated)) + " " + meetingDate.formatted(Date.FormatStyle().day(.defaultDigits)) + " " + meetingDate.formatted(Date.FormatStyle().year(.defaultDigits))
    return date
}

// Dynamic layout
func getLayout(width: Int) -> [GridItem] {
    let column_num = Int((width - 100) / 300)
    let layout: [GridItem] = Array(repeating: .init(.flexible(), spacing: 30), count: column_num)
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

// Preview
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        let stickyList = StickyData()
        let dataManager = ExternalDataManager(stickyData: stickyList)
        ContentView(dataManager: dataManager)
            .environmentObject(stickyList)
    }
}

// Not Using
extension UIScreen {
    static let screenWidth = UIScreen.main.bounds.size.width
    static let screenHeight = UIScreen.main.bounds.size.height
    static let screenSize = UIScreen.main.bounds.size
}

// Custom view modifier to track rotation
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
