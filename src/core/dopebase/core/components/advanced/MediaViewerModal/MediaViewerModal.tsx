import React from 'react';
import {
  View,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import Modal from 'react-native-modalbox';
import { Image } from 'expo-image';
import styles from './styles';

const { width, height } = Dimensions.get('window');
const swipeArea = Math.floor(height * 0.2);

type MediaViewerModalProps = {
  mediaItems: string[];
  isModalOpen: boolean;
  onClosed: () => void;
  selectedMediaIndex: number;
};

type MediaViewerModalState = {
  heights: Record<string, number>;
};

type ExpoImageLoadEvent = {
  nativeEvent?: {
    source?: {
      width?: number;
      height?: number;
    };
    width?: number;
    height?: number;
  };
};

export class MediaViewerModal extends React.Component<
  MediaViewerModalProps,
  MediaViewerModalState
> {
  imageLoading = false;
  imageDoneLoading = false;
  mediaLayouts: number[] = [];
  scrollviewRef = React.createRef<ScrollView>();

  constructor(props: MediaViewerModalProps) {
    super(props);

    this.state = {
      heights: {
        default: Math.floor(height * 0.6),
      },
    };
  }

  onScrollView = (scrollviewRef: ScrollView | null) => {
    setTimeout(() => {
      if (scrollviewRef) {
        scrollviewRef.scrollTo({
          y: 0,
          x: this.mediaLayouts[this.props.selectedMediaIndex] || 0,
          animated: false,
        });
      }
    }, 500);
  };

  onImageLoad = (evt: ExpoImageLoadEvent, uri: string) => {
    const { heights } = this.state;

    const imageHeight =
      evt.nativeEvent?.source?.height || evt.nativeEvent?.height;
    const imageWidth =
      evt.nativeEvent?.source?.width || evt.nativeEvent?.width;

    if (!imageHeight || !imageWidth) {
      return;
    }

    const newHeight = Math.floor((imageHeight / imageWidth) * width);

    if (newHeight) {
      this.setState({
        heights: { ...heights, [uri]: newHeight },
      });
    }
  };

  renderCloseButton() {
    return (
      <TouchableOpacity
        style={styles.closeButton}
        onPress={this.props.onClosed}
      >
        <View
          style={[styles.closeCross, { transform: [{ rotate: '45deg' }] }]}
        />
        <View
          style={[styles.closeCross, { transform: [{ rotate: '-45deg' }] }]}
        />
      </TouchableOpacity>
    );
  }

  render() {
    const { isModalOpen, onClosed, mediaItems } = this.props;
    const { heights } = this.state;

    return (
      <Modal
        style={styles.container}
        isOpen={isModalOpen}
        onClosed={onClosed}
        position="center"
        swipeToClose
        swipeArea={swipeArea}
        swipeThreshold={4}
        coverScreen
        backButtonClose
        useNativeDriver={Platform.OS === 'android'}
        animationDuration={500}
      >
        {this.renderCloseButton()}

        <ScrollView
          ref={this.onScrollView}
          style={{ height: '100%', width: '100%' }}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
        >
          {mediaItems.length > 0 &&
            mediaItems.map((uri, index) => (
              <View
                key={`${uri}-${index}`}
                style={styles.container}
                onLayout={(event: LayoutChangeEvent) => {
                  const layout = event.nativeEvent.layout;
                  this.mediaLayouts[index] = layout.x;
                }}
              >
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={[
                      styles.deck,
                      { height: heights[uri] || heights.default },
                    ]}
                    contentFit="contain"
                    onLoad={e => this.onImageLoad(e as ExpoImageLoadEvent, uri)}
                  />
                ) : null}
              </View>
            ))}
        </ScrollView>
      </Modal>
    );
  }
}