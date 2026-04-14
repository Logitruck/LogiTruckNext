import { Platform, Dimensions } from 'react-native'

const device = Dimensions.get('window')

// iOS
let iosScale = 1
switch (device.width) {
  case 320:
    iosScale = 0.77
    break
  case 375:
    iosScale = 0.902
    break
  case 414:
    iosScale = 1
    break
  default:
    iosScale = 1
}

// Android
let androidScale = device.width <= 414 ? device.width / 414 : 1

const scale = Platform.select({
  ios: iosScale,
  android: androidScale,
  web: iosScale,
})

export const size = (pixel: number) => Math.ceil(pixel * (scale ?? 1))
export const getScale = () => scale