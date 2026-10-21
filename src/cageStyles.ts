export type CageStyle = {
  id: string;
  name: string;
};

// 使える檻の一覧。檻の種類を増やすときはここに足す（見た目は CageView / ウィジェットで描く）。
export const CAGE_STYLES: readonly CageStyle[] = [{ id: 'standard', name: 'スタンダード' }];
