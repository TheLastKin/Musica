import Cocoa
import AVKit
import AVFoundation

extension NSWindow.Level {
    static let desktop = NSWindow.Level(rawValue: Int(CGWindowLevelForKey(.desktopWindow)))
}

class NoFocusWindow: NSWindow {
    override var canBecomeKey: Bool {
        return false
    }
    override var canBecomeMain: Bool {
        return false
    }
}

@objc public class SwiftCode: NSObject {
    private static var videoView: VideoView?
    private static var window: NoFocusWindow?
    @objc public static func spawnWindow(_ filePath: String , time: Double) -> Void {
        DispatchQueue.main.async {
            if NSApp == nil {
                // If no NSApplication exists, create one.
                let app = NSApplication.shared
                app.setActivationPolicy(.regular)
            }

            guard let screen = NSScreen.main else { return }

            let frame = screen.frame

            if window == nil {
                window = NoFocusWindow(
                    contentRect: frame,
                    styleMask: .borderless,
                    backing: .buffered,
                    defer: false,
                    screen: screen
                )
                window?.isOpaque = false
                window?.backgroundColor = NSColor.white
                window?.level = .desktop
                window?.collectionBehavior = [
                    .canJoinAllSpaces,
                    .stationary,
                    .ignoresCycle,
                    .transient
                ]
                window?.styleMask.insert(.nonactivatingPanel)
                window?.hidesOnDeactivate = false
                window?.canHide = false
                window?.isMovable = false
                window?.ignoresMouseEvents = true
                window?.isReleasedWhenClosed = false
                window?.makeKeyAndOrderFront(nil)
            }
            // NSApp.activate(ignoringOtherApps: true)

            if videoView == nil {
                videoView = VideoView(frame: frame)
                window?.contentView = videoView
            }

            videoView?.playVideo(url: URL(fileURLWithPath: filePath), atTime: time)

        }
    }

    @objc public static func closeWindow() -> Void {
        DispatchQueue.main.async {
            if window != nil {
                window?.orderOut(nil)
                window?.close()
                window = nil
            }
        }
    }

    @objc public static func toggleVideo() -> Void {
        DispatchQueue.main.async {
            if let v = videoView {
                v.toggleVideo()
            }
        }
    }
}

class VideoView: NSView {
    private var player: AVPlayer?
    private var currentURL: URL?

    override init(frame frameRect: NSRect) {
        super.init(frame: frameRect)
        wantsLayer = true
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func playVideo(url: URL, atTime: Double) {
        if currentURL == url {
            player?.seek(to: CMTime(seconds: atTime, preferredTimescale: 600))
        }else {
            player = AVPlayer(url: url)
            let playerLayer = AVPlayerLayer(player: player)
            playerLayer.frame = bounds
            playerLayer.autoresizingMask = [.layerWidthSizable, .layerHeightSizable]
            playerLayer.videoGravity = .resizeAspectFill
            layer?.addSublayer(playerLayer)

            let startTime = CMTime(seconds: atTime, preferredTimescale: 600)
            player?.seek(to: startTime)
            player?.isMuted = true
            player?.play()
            player?.actionAtItemEnd = .none
            currentURL = url

            // Loop forever, because wallpapers don’t quit
            NotificationCenter.default.addObserver(
                forName: .AVPlayerItemDidPlayToEndTime,
                object: player?.currentItem,
                queue: .main
            ) { [weak self] _ in
                self?.player?.seek(to: .zero)
                self?.player?.play()
            }
        }
    }

    func toggleVideo() {
        if let p = player {
            if p.timeControlStatus == .playing {
                p.pause()
            }else{ 
                p.play()
            }
        }
    }
}

@_cdecl("spawnWindowSwift")
public func spawnWindowSwift(filePath: String, atTime: Double) {
    SwiftCode.spawnWindow(filePath, time: atTime)
}
@_cdecl("closeWindowSwift")
public func closeWindowSwift() {
    SwiftCode.closeWindow()
}
@_cdecl("toggleVideoSwift")
public func toggleVideoSwift() {
    SwiftCode.toggleVideo()
}