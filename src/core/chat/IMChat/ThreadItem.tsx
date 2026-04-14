import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Image } from 'expo-image';
import {
  useTheme,
  useTranslations,
  IconButton,
  TouchableIcon,
} from '../../dopebase';
import ThreadMediaItem from './ThreadMediaItem';
import { IMRichTextView, IMRichTextTXView } from '../../mentions';
import FacePile from './FacePile';
import dynamicStyles, { WINDOW_HEIGHT } from './styles';
import type {
  ChatMessage,
  ChatParticipant,
} from '../api/firebase/firebaseChatClient';

const assets: Record<string, any> = {
  boederImgSend: require('../assets/borderImg1.png'),
  boederImgReceive: require('../assets/borderImg2.png'),
  textBoederImgSend: require('../assets/textBorderImg1.png'),
  textBoederImgReceive: require('../assets/textBorderImg2.png'),
  reply: require('../assets/reply-icon.png'),
  surprised: require('../assets/wow.png'),
  laugh: require('../assets/crylaugh.png'),
  cry: require('../assets/crying.png'),
  like: require('../assets/blue-like.png'),
  love: require('../assets/red-heart.png'),
  angry: require('../assets/anger.png'),
};

type TranslationItem = {
  language?: string;
  translatedContent?: string;
};

type StoryReactionKey =
  | 'surprised'
  | 'laugh'
  | 'cry'
  | 'like'
  | 'love'
  | 'angry'
  | string;

type ThreadMessage = ChatMessage & {
  senderFirstName?: string;
  senderLastName?: string;
  senderProfilePictureURL?: string;
  translations?: TranslationItem[];
  reactions?: Record<string, string[]>;
  reactionsCount?: number;
  readUserIDs?: string[];
  inReplyToItem?: {
    senderFirstName?: string;
    senderLastName?: string;
    content?: string;
    [key: string]: any;
  } | null;
  inReplyToStory?: boolean;
  storyReaction?: StoryReactionKey;
  missedCallMessage?: boolean;
  missedCallUserIDs?: string[];
  callType?: 'audio' | 'video' | string;
  translatedContent?: string;
  media?: {
    type?: string;
    url?: string;
    [key: string]: any;
  } | null;
};

type ThreadUser = ChatParticipant & {
  id: string;
  userID?: string;
  language?: string;
};

type ThreadItemProps = {
  item: ThreadMessage;
  participants?: ChatParticipant[];
  user: ThreadUser;
  onChatMediaPress?: (item: any) => void;
  onSenderProfilePicturePress?: (item: any) => void;
  onMessageLongPress?: (
    item: ThreadMessage,
    isMedia?: boolean,
    reactionsPosition?: number,
  ) => void;
  isRecentItem?: boolean;
  onChatUserItemPress?: (item: any) => void;
};

function ThreadItem({
  item,
  participants,
  user,
  onChatMediaPress,
  onSenderProfilePicturePress,
  onMessageLongPress,
  isRecentItem = false,
  onChatUserItemPress,
}: ThreadItemProps) {
  const translations = item.translations;
  const { language } = user;

  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const senderProfilePictureURL = item.senderProfilePictureURL;
  const [seenFacepilePhotoURLs, setSeenFacepilePhotoURLs] = useState<string[]>(
    [],
  );


const videoRef = useRef<any>(null);
const imagePath = useRef<any>(null);
const threadRef = useRef<any>(null);

  const updateItemImagePath = (path: any) => {
    imagePath.current = path;
  };

  const isAudio =
    item.media && item.media.type && item.media.type.startsWith('audio');
  const isFile =
    item.media && item.media.type && item.media.type.startsWith('file');
  const isVideo =
    item.media && item.media.type && item.media.type.startsWith('video');
  const outBound = item.senderID === user.id;
  const inBound = item.senderID !== user.id;

  useEffect(() => {
    const profilePhotos: string[] = [];

    if (outBound && isRecentItem && participants && item?.readUserIDs) {
      item.readUserIDs.forEach(readUserID => {
        const userFace = participants.find(
          participant => participant.id === readUserID,
        );

        if (
          userFace &&
          userFace.id !== user.id &&
          userFace.profilePictureURL
        ) {
          profilePhotos.push(userFace.profilePictureURL);
        }
      });
    }

    setSeenFacepilePhotoURLs(profilePhotos);
  }, [item?.readUserIDs, participants, user, outBound, isRecentItem]);

  const didPressMediaChat = () => {
    if (isAudio) {
      return;
    }

    const newLegacyItemURl = imagePath.current;
    const newItemURl = { ...item.media, url: imagePath.current };
    let itemUrlToUse: any;

    if (!item.media?.url) {
      itemUrlToUse = newLegacyItemURl;
    } else {
      itemUrlToUse = newItemURl;
    }

    if (isVideo) {
      videoRef.current?.presentFullscreenPlayer?.();
    } else {
      onChatMediaPress?.({ ...item, senderProfilePictureURL, url: itemUrlToUse });
    }
  };

  const renderTextBoederImg = () => {
    if (item.senderID === user.userID) {
      return (
        <Image
          source={assets.textBoederImgSend}
          style={styles.textBoederImgSend}
        />
      );
    }

    if (item.senderID !== user.userID) {
      return (
        <Image
          source={assets.textBoederImgReceive}
          style={styles.textBoederImgReceive}
        />
      );
    }

    return null;
  };

  const renderBoederImg = () => {
    if (isAudio || isFile) {
      return renderTextBoederImg();
    }

    if (item.senderID === user.userID) {
      return (
        <Image source={assets.boederImgSend} style={styles.boederImgSend} />
      );
    }

    if (item.senderID !== user.userID) {
      return (
        <Image
          source={assets.boederImgReceive}
          style={styles.boederImgReceive}
        />
      );
    }

    return null;
  };

  const renderInReplyToIfNeeded = (message: ThreadMessage, isMine: boolean) => {
    const inReplyToItem = message.inReplyToItem;

    if (
      inReplyToItem &&
      inReplyToItem?.content &&
      inReplyToItem?.content?.length > 0
    ) {
      return (
        <View
          style={
            isMine
              ? styles.inReplyToItemContainerView
              : styles.inReplyToTheirItemContainerView
          }
        >
          <View style={styles.inReplyToItemHeaderView}>
            <Image style={styles.inReplyToIcon} source={assets.reply} />
            <Text style={styles.inReplyToHeaderText}>
              {isMine
                ? localized('You replied to ') +
                  (inReplyToItem.senderFirstName ||
                    inReplyToItem.senderLastName ||
                    '')
                : (message.senderFirstName || message.senderLastName || '') +
                  localized(' replied to ') +
                  (inReplyToItem.senderFirstName ||
                    inReplyToItem.senderLastName ||
                    '')}
            </Text>
          </View>
          <View style={styles.inReplyToItemBubbleView}>
            <IMRichTextView
              onUserPress={onChatUserItemPress}
              defaultTextStyle={styles.inReplyToItemBubbleText}
            >
              {message?.inReplyToItem?.content?.slice(0, 50)}
            </IMRichTextView>
          </View>
        </View>
      );
    }

    return null;
  };

  const renderInReplyToStory = (message: ThreadMessage, isMine: boolean) => {
    if (message?.inReplyToStory) {
      return (
        <View
          style={
            isMine
              ? styles.inReplyToTheirStoryContainer
              : styles.inReplyToStoryContainer
          }
        >
          <Text style={styles.inReplyToHeaderText}>
            {isMine
              ? message?.storyReaction
                ? localized('You reacted to their story')
                : localized('You replied to their story')
              : message?.storyReaction
                ? localized('Reacted on your story')
                : localized('Replied to your story')}
          </Text>
        </View>
      );
    }

    return null;
  };

  const handleOnPress = () => {};

  const handleOnLongPress = () => {
    threadRef.current?.measure?.(
      (
        _fx: number,
        _fy: number,
        _width: number,
        _height: number,
        _px: number,
        py: number,
      ) => {
        let reactionsPosition = 0;

        if (py <= 0) {
          reactionsPosition = py * -1 + WINDOW_HEIGHT * 0.05;
        } else if (py - WINDOW_HEIGHT * 0.2 < WINDOW_HEIGHT * 0.05) {
          reactionsPosition = py - WINDOW_HEIGHT * 0.07;
        } else {
          reactionsPosition = py - WINDOW_HEIGHT * 0.2;
        }

        onMessageLongPress?.(
          item,
          Boolean(isAudio || isVideo || item.media),
          reactionsPosition,
        );
      },
    );
  };

  const handleOnPressOut = () => {};

const renderReactionsContainer = useCallback(() => {
  let totalIcons = 0;
  const reactions = item?.reactions ?? {};

  if ((item?.reactionsCount ?? 0) > 0) {
    return (
      <View style={styles.threadItemReactionContainer}>
        {Object.keys(reactions).map((reactionKey, index) => {
          const reactionUsers = reactions[reactionKey] ?? [];

          if (reactionUsers.length > 0 && totalIcons < 3) {
            totalIcons = totalIcons + 1;

            return (
              <TouchableIcon
                key={`reactions-${index}`}
                containerStyle={styles.threadReactionIconContainer}
                iconSource={assets[reactionKey]}
                imageStyle={styles.threadReactionIcon}
              />
            );
          }

          return null;
        })}
        <Text style={styles.threadItemReactionsCountText}>
          {item?.reactionsCount}
        </Text>
      </View>
    );
  }

  return null;
}, [item, styles]);

  const renderMissedCallMessage = useCallback(() => {
    return (
      <View style={styles.missedCallMessageContainer}>
        {item?.callType === 'audio' ? (
          <>
            <IconButton
              source={require('../assets/missed-voice-call.png')}
              marginRight={15}
              width={40}
              height={40}
            />
            <IMRichTextView defaultTextStyle={styles.receiveTextMessage}>
              {localized('Missed audio call')}
            </IMRichTextView>
          </>
        ) : (
          <>
            <IconButton
              source={require('../assets/missed-video-call.png')}
              marginRight={15}
              width={40}
              height={40}
            />
            <IMRichTextView defaultTextStyle={styles.receiveTextMessage}>
              {localized('Missed video call')}
            </IMRichTextView>
          </>
        )}
      </View>
    );
  }, [item?.callType, localized, styles.receiveTextMessage]);

  if (
    !(outBound && item?.missedCallMessage) &&
    !(
      inBound &&
      item?.missedCallMessage &&
      !item?.missedCallUserIDs?.includes(user?.id)
    )
  ) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleOnPress}
        onLongPress={handleOnLongPress}
        onPressOut={handleOnPressOut}
      >
        <View
          ref={ref => {
            threadRef.current = ref;
          }}
        >
          {outBound && (
            <>
              <View style={styles.sendItemContainer}>
                {item.media != null && (
                  <TouchableOpacity
                    onPress={didPressMediaChat}
                    onLongPress={handleOnLongPress}
                    activeOpacity={0.9}
                    style={[
                      styles.itemContent,
                      styles.sendItemContent,
                      { padding: 0, marginRight: isAudio || isFile ? 8 : -1 },
                    ]}
                  >
                    <ThreadMediaItem
                      outBound={outBound}
                      updateItemImagePath={updateItemImagePath}
                      videoRef={videoRef}
                      dynamicStyles={styles}
                      item={item}
                    />
                    {renderBoederImg()}
                    {renderReactionsContainer()}
                  </TouchableOpacity>
                )}

                {!item.media && (
                  <View style={styles.myMessageBubbleContainerView}>
                    {renderInReplyToIfNeeded(item, true)}
                    {renderInReplyToStory(item, true)}
                    <View style={[styles.itemContent, styles.sendItemContent]}>
                      {item?.storyReaction ? (
                        <TouchableIcon
                          containerStyle={styles.storyReactionStickerContainer}
                          iconSource={assets[item.storyReaction]}
                          imageStyle={styles.storyReactionSticker}
                          disabled={true}
                        />
                      ) : (
                        <IMRichTextView
                          onUserPress={onChatUserItemPress}
                          defaultTextStyle={styles.sendTextMessage}
                        >
                          {item?.content}
                        </IMRichTextView>
                      )}
                      {renderTextBoederImg()}
                      {renderReactionsContainer()}
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() =>
                    onSenderProfilePicturePress?.(item)
                  }
                >
                  <Image
                    style={styles.userIcon}
                    source={{ uri: senderProfilePictureURL }}
                  />
                </TouchableOpacity>
              </View>

              {isRecentItem && seenFacepilePhotoURLs?.length > 0 && (
                <View style={styles.sendItemContainer}>
                  <FacePile numFaces={4} faces={seenFacepilePhotoURLs} />
                </View>
              )}
            </>
          )}

          {inBound && (
            <View style={styles.receiveItemContainer}>
              <TouchableOpacity
                onPress={() =>
                  onSenderProfilePicturePress?.(item)
                }
              >
                <Image
                  style={styles.userIcon}
                  source={{ uri: senderProfilePictureURL }}
                />
              </TouchableOpacity>

              {item.media != null && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onLongPress={handleOnLongPress}
                  style={[
                    styles.itemContent,
                    styles.receiveItemContent,
                    { padding: 0, marginLeft: isAudio || isFile ? 8 : -1 },
                  ]}
                  onPress={didPressMediaChat}
                >
                  <ThreadMediaItem
                    updateItemImagePath={updateItemImagePath}
                    videoRef={videoRef}
                    dynamicStyles={styles}
                    item={item}
                  />
                  {renderBoederImg()}
                  {renderReactionsContainer()}
                </TouchableOpacity>
              )}

              {!item.media && (
                <View style={styles.theirMessageBubbleContainerView}>
                  {renderInReplyToIfNeeded(item, false)}
                  {renderInReplyToStory(item, false)}
                  <View style={[styles.itemContent, styles.receiveItemContent]}>
                    {!item?.missedCallMessage ? (
                      item?.storyReaction ? (
                        <TouchableIcon
                          containerStyle={styles.storyReactionStickerContainer}
                          iconSource={assets[item.storyReaction]}
                          imageStyle={styles.storyReactionSticker}
                          disabled={true}
                        />
                      ) : (
                        <>
                          <IMRichTextView
                            onUserPress={onChatUserItemPress}
                            defaultTextStyle={styles.receiveTextMessage}
                          >
                            {item?.content}
                          </IMRichTextView>

                          {translations && translations.length > 0 && (
                            <IMRichTextTXView
                              onUserPress={onChatUserItemPress}
                              defaultTextStyle={styles.receiveTextTXMessage}
                            >
                              {
                                translations.find(
                                  t => t.language === language,
                                )?.translatedContent
                              }
                            </IMRichTextTXView>
                          )}
                        </>
                      )
                    ) : item?.missedCallMessage ? (
                      renderMissedCallMessage()
                    ) : (
                      <></>
                    )}

                    {renderTextBoederImg()}
                    {renderReactionsContainer()}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return <></>;
}

export default ThreadItem;