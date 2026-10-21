import SwiftUI
import WidgetKit

// アプリ(JS)が App Group のコンテナに書き込んだ画像(cage_image.png)を読む。
private let imageFileName = "cage_image.png"
private let styleKey = "cageStyleID"   // アプリ(JS)が ExtensionStorage で書く。standard なら未設定

private func appGroupID() -> String? {
    // app.config.js の BUNDLE_ID から "group.<bundle id>" を作っているので、
    // ウィジェットの bundle id（<app>.widget 等）から親アプリの ID を導く。
    guard var id = Bundle.main.bundleIdentifier else { return nil }
    while id.split(separator: ".").count > 3 {
        id = id.split(separator: ".").dropLast().joined(separator: ".")
    }
    return "group.\(id)"
}

private func loadCageImage() -> UIImage? {
    guard let group = appGroupID(),
          let dir = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: group)
    else { return nil }
    return UIImage(contentsOfFile: dir.appendingPathComponent(imageFileName).path)
}

private func loadStyleID() -> String {
    guard let group = appGroupID(),
          let id = UserDefaults(suiteName: group)?.string(forKey: styleKey)
    else { return "standard" }
    return id
}

// 画像が読めないときの原因調べ用。ウィジェットの中に小さく出す（c: 共有領域 / f: 画像ファイル）
private func diagnostics() -> String {
    guard let group = appGroupID() else { return "id:none" }
    let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: group)
    let hasContainer = container != nil
    var hasFile = false
    if let container {
        hasFile = FileManager.default.fileExists(atPath: container.appendingPathComponent(imageFileName).path)
    }
    return "c:" + (hasContainer ? "ok" : "ng") + " f:" + (hasFile ? "ok" : "no")
}

struct CageEntry: TimelineEntry {
    let date: Date
    let image: UIImage?
    let styleID: String
    let diag: String
}

struct CageProvider: TimelineProvider {
    func placeholder(in context: Context) -> CageEntry {
        CageEntry(date: .now, image: nil, styleID: "standard", diag: "")
    }

    func getSnapshot(in context: Context, completion: @escaping (CageEntry) -> Void) {
        completion(CageEntry(date: .now, image: loadCageImage(), styleID: loadStyleID(), diag: diagnostics()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CageEntry>) -> Void) {
        // 画像変更時はアプリ側から reloadWidget() されるので .never
        completion(Timeline(entries: [CageEntry(date: .now, image: loadCageImage(), styleID: loadStyleID(), diag: diagnostics())], policy: .never))
    }
}

struct CageView: View {
    let image: UIImage?
    let styleID: String
    let diag: String

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let squareName = styleID == "standard" ? "cage_square" : "cage_square_\(styleID)"
            let bgName = styleID == "standard" ? "bg" : "bg_\(styleID)"

            ZStack(alignment: .bottom) {
                // 背景は下端基準。画像が見つからなくても、真っ白にならないよう色で代用する
                if UIImage(named: bgName) != nil {
                    Image(bgName)
                        .resizable()
                        .scaledToFill()
                        .frame(width: w, height: h, alignment: .bottom)
                        .clipped()
                } else {
                    Color(red: 0.89, green: 0.86, blue: 1.0)
                }

                // 画像の下端を床(約91%の高さ)に置く
                if let image {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(width: w * 0.8, height: h * 0.78, alignment: .bottom)
                        .padding(.bottom, h * 0.09)
                } else {
                    // まだ檻を作っていない（または画像を読めない）とき
                    VStack(spacing: 6) {
                        Text("アプリで\n画像を選んでね")
                            .font(.system(size: min(w, h) * 0.09, weight: .bold))
                            .multilineTextAlignment(.center)
                        Text(diag)
                            .font(.system(size: min(w, h) * 0.05, design: .monospaced))
                    }
                    .foregroundColor(Color(red: 0.2, green: 0.18, blue: 0.3))
                    .frame(width: w, height: h * 0.9, alignment: .center)
                }

                if UIImage(named: squareName) != nil {
                    Image(squareName)
                        .resizable()
                        .frame(width: w, height: h)
                }
            }
            .frame(width: w, height: h)
        }
    }
}

struct OrikkoWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "OrikkoWidget", provider: CageProvider()) { entry in
            CageView(image: entry.image, styleID: entry.styleID, diag: entry.diag)
                .containerBackground(for: .widget) { Color.black }
        }
        .configurationDisplayName("おりっこ")
        .description("アップした画像が檻に閉じ込められています。")
        .supportedFamilies([.systemSmall, .systemLarge])
        .contentMarginsDisabled()
    }
}

@main
struct OrikkoWidgetBundle: WidgetBundle {
    var body: some Widget {
        OrikkoWidget()
    }
}
