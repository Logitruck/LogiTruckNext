export const displayTextWithMentions = (
  inputText: string,
  formatMentionNode: (text: string, key: string) => any,
  formatNonMentionNode: (text: string, key: string) => any = () => {},
) => {
  if (inputText === '') return null;

  const retLines = inputText.split('\n');
  const formattedText: any[] = [];

  retLines.forEach((retLine, rowIndex) => {
    const mentions = EU.findMentions(retLine);

    if (mentions.length) {
      let lastIndex = 0;

      mentions.forEach((men, index) => {
        const initialStr = retLine.substring(lastIndex, men.start);
        lastIndex = men.end + 1;
        formattedText.push(initialStr);

        const formattedMention = formatMentionNode(
          `@${men.username}`,
          `${index}-${men.id}-${rowIndex}`,
        );
        formattedText.push(formattedMention);

        if (mentions.length - 1 === index) {
          const lastStr = retLine.substr(lastIndex);
          formattedText.push(lastStr);
        }
      });
    } else {
      formatNonMentionNode(`${retLine}`, `${retLine}`);
      formattedText.push(retLine);
    }

    formattedText.push('\n');
  });

  return formattedText;
};

type MentionMeta = {
  start: number;
  end: number;
  username: string;
  id: string;
  type: string;
};

const EU = {
  specialTagsEnum: {
    mention: 'mention',
    strong: 'strong',
    italic: 'italic',
    underline: 'underline',
  },

  isKeysAreSame: (src: any, dest: any) => src.toString() === dest.toString(),
  getLastItemInMap: (map: Map<any, any>) => Array.from(map)[map.size - 1],
  getLastKeyInMap: (map: Map<any, any>) => Array.from(map.keys())[map.size - 1],
  getLastValueInMap: (map: Map<any, any>) =>
    Array.from(map.values())[map.size - 1],

  updateRemainingMentionsIndexes: (
    map: Map<any, any>,
    { start, end }: { start: number; end: number },
    diff: number,
    shouldAdd: boolean,
  ) => {
    const newMap = new Map(map);
    const keys = EU.getSelectedMentionKeys(newMap, { start, end });

    keys.forEach((key: [number, number]) => {
      const newKey = shouldAdd
        ? [key[0] + diff, key[1] + diff]
        : [key[0] - diff, key[1] - diff];

      const value = newMap.get(key);
      newMap.delete(key);
      newMap.set(newKey, value);
    });

    return newMap;
  },

  getSelectedMentionKeys: (
    map: Map<any, any>,
    { start, end }: { start: number; end: number },
  ) => {
    const mentionKeys = [...map.keys()];
    return mentionKeys.filter(
      ([a, b]) => EU.between(a, start, end) || EU.between(b, start, end),
    );
  },

  findMentionKeyInMap: (map: Map<any, any>, cursorIndex: number) => {
    const keys = [...map.keys()];
    return keys.filter(([a, b]) => EU.between(cursorIndex, a, b))[0];
  },

  addMenInSelection: (
    selection: { start: number; end: number },
    prevSelc: { start: number; end: number },
    mentions: Map<any, any>,
  ) => {
    const sel = { ...selection };

    mentions.forEach((value, [menStart, menEnd]) => {
      if (EU.diff(prevSelc.start, prevSelc.end) < EU.diff(sel.start, sel.end)) {
        if (EU.between(sel.start, menStart, menEnd)) {
          sel.start = menStart;
        }
        if (EU.between(sel.end - 1, menStart, menEnd)) {
          sel.end = menEnd + 1;
        }
      } else {
        if (EU.between(sel.start, menStart, menEnd)) {
          sel.start = menEnd + 1;
        }
        if (EU.between(sel.end, menStart, menEnd)) {
          sel.end = menStart;
        }
      }
    });

    return sel;
  },

  moveCursorToMentionBoundry: (
    selection: { start: number; end: number },
    prevSelc: { start: number; end: number },
    mentions: Map<any, any>,
    isTrackingStarted: boolean,
  ) => {
    const sel = { ...selection };
    if (isTrackingStarted) return sel;

    mentions.forEach((value, [menStart, menEnd]) => {
      if (prevSelc.start > sel.start) {
        if (EU.between(sel.start, menStart, menEnd)) {
          sel.start = menStart;
          sel.end = menStart;
        }
      } else {
        if (EU.between(sel.start - 1, menStart, menEnd)) {
          sel.start = menEnd + 1;
          sel.end = menEnd + 1;
        }
      }
    });

    return sel;
  },

  between: (x: number, min: number, max: number) => x >= min && x <= max,
  sum: (x: number, y: number) => x + y,
  diff: (x: number, y: number) => Math.abs(x - y),
  isEmpty: (str: string) => str === '',

  getMentionsWithInputText: (inputText: string) => {
    const map = new Map();
    let newValue = '';

    if (inputText === '') return null;
    const retLines = inputText.split('\n');

    retLines.forEach((retLine, rowIndex) => {
      const mentions = EU.findMentions(retLine);

      if (mentions.length) {
        let lastIndex = 0;
        let endIndexDiff = 0;

        mentions.forEach((men, index) => {
          newValue = newValue.concat(retLine.substring(lastIndex, men.start));
          const username = `@${men.username}`;
          newValue = newValue.concat(username);
          const menEndIndex = men.start + (username.length - 1);

          map.set([men.start - endIndexDiff, menEndIndex - endIndexDiff], {
            id: men.id,
            username: men.username,
          });

          endIndexDiff = endIndexDiff + Math.abs(men.end - menEndIndex);
          lastIndex = men.end + 1;

          if (mentions.length - 1 === index) {
            const lastStr = retLine.substr(lastIndex);
            newValue = newValue.concat(lastStr);
          }
        });
      } else {
        newValue = newValue.concat(retLine);
      }

      if (rowIndex !== retLines.length - 1) {
        newValue = newValue.concat('\n');
      }
    });

    return {
      map,
      newValue,
    };
  },

  findMentions: (val: string): MentionMeta[] => {
    const reg = /@\[([^\]]+?)\]\(id:([^\]]+?)\)/gim;
    const indexes: MentionMeta[] = [];
    let match: RegExpExecArray | null = null;

    while ((match = reg.exec(val))) {
      indexes.push({
        start: match.index,
        end: reg.lastIndex - 1,
        username: match[1],
        id: match[2],
        type: EU.specialTagsEnum.mention,
      });
    }

    return indexes;
  },

  whenTrue: (next: any, current: any, key: string) => {
    return next[key] && next[key] !== current[key];
  },

  displayTextWithMentions,
};

export { EU };
export default EU;