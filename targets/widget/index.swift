import SwiftUI
import WidgetKit

// アプリ(JS)が ExtensionStorage で書き込む値を読む。
// App Group は Info.plist の AppGroup キーではなく、entitlements の先頭を使う。
private let selectionKey = "selectedCharacterID"
private let fallbackID = "mobirin"

private func appGroupID() -> String? {
    // app.config.js の BUNDLE_ID から "group.<bundle id>" を作っているので、
    // ウィジェットの bundle id（<app>.widget 等）から親アプリの ID を導く。
    guard var id = Bundle.main.bundleIdentifier else { return nil }
    while id.split(separator: ".").count > 3 {
        id = id.split(separator: ".").dropLast().joined(separator: ".")
    }
    return "group.\(id)"
}

private func selectedID() -> String {
    guard let group = appGroupID(),
          let id = UserDefaults(suiteName: group)?.string(forKey: selectionKey)
    else { return fallbackID }
    return id
}

struct CageEntry: TimelineEntry {
    let date: Date
    let characterID: String
}

struct CageProvider: TimelineProvider {
    func placeholder(in context: Context) -> CageEntry {
        CageEntry(date: .now, characterID: fallbackID)
    }

    func getSnapshot(in context: Context, completion: @escaping (CageEntry) -> Void) {
        completion(CageEntry(date: .now, characterID: selectedID()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CageEntry>) -> Void) {
        // 選択変更時はアプリ側から reloadWidget() されるので .never
        completion(Timeline(entries: [CageEntry(date: .now, characterID: selectedID())], policy: .never))
    }
}

struct CageView: View {
    let characterID: String

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let wide = w / h > 1.5   // 中サイズは横長の檻画像

            ZStack(alignment: .bottom) {
                // 背景は下端基準（横長でも床が見える）
                Image("bg")
                    .resizable()
                    .scaledToFill()
                    .frame(width: w, height: h, alignment: .bottom)
                    .clipped()

                // キャラ画像は足元が画像の下端に揃えてある。足元を床(約91%の高さ)に置く
                Image(characterID)
                    .resizable()
                    .scaledToFit()
                    .frame(width: w * 0.8, height: h * 0.78, alignment: .bottom)
                    .padding(.bottom, h * 0.09)

                Image(wide ? "cage_wide" : "cage_square")
                    .resizable()
                    .frame(width: w, height: h)
                    .opacity(0.85)
            }
            .frame(width: w, height: h)
        }
    }
}

struct OriCharaWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "OriCharaWidget", provider: CageProvider()) { entry in
            CageView(characterID: entry.characterID)
                .containerBackground(for: .widget) { Color.black }
        }
        .configurationDisplayName("檻キャラ")
        .description("選んだキャラが檻に閉じ込められています。")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}

@main
struct OriCharaWidgetBundle: WidgetBundle {
    var body: some Widget {
        OriCharaWidget()
    }
}
