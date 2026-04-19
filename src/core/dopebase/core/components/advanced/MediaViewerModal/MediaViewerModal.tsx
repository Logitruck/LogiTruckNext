import React from 'react';
import {
  Dimensions,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import styles from './styles';

const { width, height } = Dimensions.get('window');

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
  source?: {
    width?: number;
    height?: number;
  };
};

export class MediaViewerModal extends React.Component<
  MediaViewerModalProps,
  MediaViewerModalState
> {
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

  componentDidUpdate(prevProps: MediaViewerModalProps) {
    const openedNow =
      this.props.isModalOpen && !prevProps.isModalOpen;

    const changedIndex =
      this.props.isModalOpen &&
      prevProps.selectedMediaIndex !== this.props.selectedMediaIndex;

    if (openedNow || changedIndex) {
      this.scrollToSelectedImage();
    }
  }

  scrollToSelectedImage = () => {
    setTimeout(() => {
      this.scrollviewRef.current?.scrollTo({
        x: this.mediaLayouts[this.props.selectedMediaIndex] || 0,
        y: 0,
        animated: false,
      });
    }, 100);
  };

  onImageLoad = (evt: ExpoImageLoadEvent, uri: string) => {
    const { heights } = this.state;

    const imageHeight = evt?.source?.height;
    const imageWidth = evt?.source?.width;

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
      <Pressable style={styles.closeButton} onPress={this.props.onClosed}>
        <View
          style={[styles.closeCross, { transform: [{ rotate: '45deg' }] }]}
        />
        <View
          style={[styles.closeCross, { transform: [{ rotate: '-45deg' }] }]}
        />
      </Pressable>
    );
  }

  render() {
    const { isModalOpen, onClosed, mediaItems } = this.props;
    const { heights } = this.state;

    return (
      <Modal
        visible={isModalOpen}
        animationType="fade"
        transparent
        statusBarTranslucent={Platform.OS === 'android'}
        onRequestClose={onClosed}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={onClosed} />

          <View style={styles.modalContent}>
            {this.renderCloseButton()}

            <ScrollView
              ref={this.scrollviewRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            >
              {mediaItems.map((uri, index) => (
                <View
                  key={`${uri}-${index}`}
                  style={styles.container}
                  onLayout={(event: LayoutChangeEvent) => {
                    this.mediaLayouts[index] = event.nativeEvent.layout.x;
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
                      onLoad={event =>
                        this.onImageLoad(event as ExpoImageLoadEvent, uri)
                      }
                    />
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }
}