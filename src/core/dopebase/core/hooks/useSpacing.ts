import { StyleProp, ViewStyle, TextStyle, ImageStyle } from 'react-native';

const BASE = 4;

type SpacingProps = {
  style?: StyleProp<ViewStyle | TextStyle | ImageStyle>;

  fx1?: boolean;
  fx2?: boolean;
  fx3?: boolean;

  mv1?: boolean;
  mv2?: boolean;
  mv3?: boolean;
  mv4?: boolean;
  mv5?: boolean;
  mv6?: boolean;
  mv7?: boolean;
  mv8?: boolean;

  mh1?: boolean;
  mh2?: boolean;
  mh3?: boolean;
  mh4?: boolean;
  mh5?: boolean;
  mh6?: boolean;
  mh7?: boolean;
  mh8?: boolean;

  mt1?: boolean;
  mt2?: boolean;
  mt3?: boolean;
  mt4?: boolean;
  mt5?: boolean;
  mt6?: boolean;
  mt7?: boolean;
  mt8?: boolean;

  mb1?: boolean;
  mb2?: boolean;
  mb3?: boolean;
  mb4?: boolean;
  mb5?: boolean;
  mb6?: boolean;
  mb7?: boolean;
  mb8?: boolean;

  ml1?: boolean;
  ml2?: boolean;
  ml3?: boolean;
  ml4?: boolean;
  ml5?: boolean;
  ml6?: boolean;
  ml7?: boolean;
  ml8?: boolean;

  mr1?: boolean;
  mr2?: boolean;
  mr3?: boolean;
  mr4?: boolean;
  mr5?: boolean;
  mr6?: boolean;
  mr7?: boolean;
  mr8?: boolean;

  pt1?: boolean;
  pt2?: boolean;
  pt3?: boolean;
  pt4?: boolean;
  pt5?: boolean;
  pt6?: boolean;
  pt7?: boolean;
  pt8?: boolean;

  pb1?: boolean;
  pb2?: boolean;
  pb3?: boolean;
  pb4?: boolean;
  pb5?: boolean;
  pb6?: boolean;
  pb7?: boolean;
  pb8?: boolean;

  pl1?: boolean;
  pl2?: boolean;
  pl3?: boolean;
  pl4?: boolean;
  pl5?: boolean;
  pl6?: boolean;
  pl7?: boolean;
  pl8?: boolean;

  pr1?: boolean;
  pr2?: boolean;
  pr3?: boolean;
  pr4?: boolean;
  pr5?: boolean;
  pr6?: boolean;
  pr7?: boolean;
  pr8?: boolean;

  br1?: boolean;
  br2?: boolean;
  br3?: boolean;
  br4?: boolean;
  br5?: boolean;
  br6?: boolean;
  br7?: boolean;
  br8?: boolean;

  [key: string]: any;
};

type SpacingStyle =
  | StyleProp<ViewStyle | TextStyle | ImageStyle>
  | ViewStyle
  | TextStyle
  | ImageStyle;

export const useSpacing = (props: SpacingProps): SpacingStyle[] => {
  const res: SpacingStyle[] = [];

  const { style } = props;
  if (style) res.push(style);

  const { fx1, fx2, fx3 } = props;
  if (fx1) res.push({ flex: 1 });
  if (fx2) res.push({ flex: 2 });
  if (fx3) res.push({ flex: 3 });

  const { mv1, mv2, mv3, mv4, mv5, mv6, mv7, mv8 } = props;
  if (mv1) res.push({ marginVertical: BASE });
  if (mv2) res.push({ marginVertical: 2 * BASE });
  if (mv3) res.push({ marginVertical: 3 * BASE });
  if (mv4) res.push({ marginVertical: 4 * BASE });
  if (mv5) res.push({ marginVertical: 5 * BASE });
  if (mv6) res.push({ marginVertical: 6 * BASE });
  if (mv7) res.push({ marginVertical: 7 * BASE });
  if (mv8) res.push({ marginVertical: 8 * BASE });

  const { mh1, mh2, mh3, mh4, mh5, mh6, mh7, mh8 } = props;
  if (mh1) res.push({ marginHorizontal: BASE });
  if (mh2) res.push({ marginHorizontal: 2 * BASE });
  if (mh3) res.push({ marginHorizontal: 3 * BASE });
  if (mh4) res.push({ marginHorizontal: 4 * BASE });
  if (mh5) res.push({ marginHorizontal: 5 * BASE });
  if (mh6) res.push({ marginHorizontal: 6 * BASE });
  if (mh7) res.push({ marginHorizontal: 7 * BASE });
  if (mh8) res.push({ marginHorizontal: 8 * BASE });

  const { mt1, mt2, mt3, mt4, mt5, mt6, mt7, mt8 } = props;
  if (mt1) res.push({ marginTop: BASE });
  if (mt2) res.push({ marginTop: 2 * BASE });
  if (mt3) res.push({ marginTop: 3 * BASE });
  if (mt4) res.push({ marginTop: 4 * BASE });
  if (mt5) res.push({ marginTop: 5 * BASE });
  if (mt6) res.push({ marginTop: 6 * BASE });
  if (mt7) res.push({ marginTop: 7 * BASE });
  if (mt8) res.push({ marginTop: 8 * BASE });

  const { mb1, mb2, mb3, mb4, mb5, mb6, mb7, mb8 } = props;
  if (mb1) res.push({ marginBottom: BASE });
  if (mb2) res.push({ marginBottom: 2 * BASE });
  if (mb3) res.push({ marginBottom: 3 * BASE });
  if (mb4) res.push({ marginBottom: 4 * BASE });
  if (mb5) res.push({ marginBottom: 5 * BASE });
  if (mb6) res.push({ marginBottom: 6 * BASE });
  if (mb7) res.push({ marginBottom: 7 * BASE });
  if (mb8) res.push({ marginBottom: 8 * BASE });

  const { ml1, ml2, ml3, ml4, ml5, ml6, ml7, ml8 } = props;
  if (ml1) res.push({ marginLeft: BASE });
  if (ml2) res.push({ marginLeft: 2 * BASE });
  if (ml3) res.push({ marginLeft: 3 * BASE });
  if (ml4) res.push({ marginLeft: 4 * BASE });
  if (ml5) res.push({ marginLeft: 5 * BASE });
  if (ml6) res.push({ marginLeft: 6 * BASE });
  if (ml7) res.push({ marginLeft: 7 * BASE });
  if (ml8) res.push({ marginLeft: 8 * BASE });

  const { mr1, mr2, mr3, mr4, mr5, mr6, mr7, mr8 } = props;
  if (mr1) res.push({ marginRight: BASE });
  if (mr2) res.push({ marginRight: 2 * BASE });
  if (mr3) res.push({ marginRight: 3 * BASE });
  if (mr4) res.push({ marginRight: 4 * BASE });
  if (mr5) res.push({ marginRight: 5 * BASE });
  if (mr6) res.push({ marginRight: 6 * BASE });
  if (mr7) res.push({ marginRight: 7 * BASE });
  if (mr8) res.push({ marginRight: 8 * BASE });

  const { pt1, pt2, pt3, pt4, pt5, pt6, pt7, pt8 } = props;
  if (pt1) res.push({ paddingTop: BASE });
  if (pt2) res.push({ paddingTop: 2 * BASE });
  if (pt3) res.push({ paddingTop: 3 * BASE });
  if (pt4) res.push({ paddingTop: 4 * BASE });
  if (pt5) res.push({ paddingTop: 5 * BASE });
  if (pt6) res.push({ paddingTop: 6 * BASE });
  if (pt7) res.push({ paddingTop: 7 * BASE });
  if (pt8) res.push({ paddingTop: 8 * BASE });

  const { pb1, pb2, pb3, pb4, pb5, pb6, pb7, pb8 } = props;
  if (pb1) res.push({ paddingBottom: BASE });
  if (pb2) res.push({ paddingBottom: 2 * BASE });
  if (pb3) res.push({ paddingBottom: 3 * BASE });
  if (pb4) res.push({ paddingBottom: 4 * BASE });
  if (pb5) res.push({ paddingBottom: 5 * BASE });
  if (pb6) res.push({ paddingBottom: 6 * BASE });
  if (pb7) res.push({ paddingBottom: 7 * BASE });
  if (pb8) res.push({ paddingBottom: 8 * BASE });

  const { pl1, pl2, pl3, pl4, pl5, pl6, pl7, pl8 } = props;
  if (pl1) res.push({ paddingLeft: BASE });
  if (pl2) res.push({ paddingLeft: 2 * BASE });
  if (pl3) res.push({ paddingLeft: 3 * BASE });
  if (pl4) res.push({ paddingLeft: 4 * BASE });
  if (pl5) res.push({ paddingLeft: 5 * BASE });
  if (pl6) res.push({ paddingLeft: 6 * BASE });
  if (pl7) res.push({ paddingLeft: 7 * BASE });
  if (pl8) res.push({ paddingLeft: 8 * BASE });

  const { pr1, pr2, pr3, pr4, pr5, pr6, pr7, pr8 } = props;
  if (pr1) res.push({ paddingRight: BASE });
  if (pr2) res.push({ paddingRight: 2 * BASE });
  if (pr3) res.push({ paddingRight: 3 * BASE });
  if (pr4) res.push({ paddingRight: 4 * BASE });
  if (pr5) res.push({ paddingRight: 5 * BASE });
  if (pr6) res.push({ paddingRight: 6 * BASE });
  if (pr7) res.push({ paddingRight: 7 * BASE });
  if (pr8) res.push({ paddingRight: 8 * BASE });

  const { br1, br2, br3, br4, br5, br6, br7, br8 } = props;
  if (br1) res.push({ borderRadius: BASE });
  if (br2) res.push({ borderRadius: 2 * BASE });
  if (br3) res.push({ borderRadius: 3 * BASE });
  if (br4) res.push({ borderRadius: 4 * BASE });
  if (br5) res.push({ borderRadius: 5 * BASE });
  if (br6) res.push({ borderRadius: 6 * BASE });
  if (br7) res.push({ borderRadius: 7 * BASE });
  if (br8) res.push({ borderRadius: 8 * BASE });

  return res;
};