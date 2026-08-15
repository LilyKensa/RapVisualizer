import LZString from "lz-string";

export type Block = {
  id: string;
  text: string;
  left?: Block;
  right?: Block;
};

export type Song = {
  bpm: number;
  sound: string;
  measures: Block[];
};

export type Project = {
  id: string;
  name: string;
  song: Song;
};

export const exportBlock = (block: Block): string =>
  block.left && block.right
    ? `[${exportBlock(block.left)}${exportBlock(block.right)}]`
    : `[${block.text.replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/\]/g, "\\]")}]`;

export const exportSong = (song: Song) => {
  const raw = `${song.bpm},${song.sound},${song.measures.map(exportBlock).join("")}`;
  return LZString.compressToUTF16(raw);
};

export const importSong = (input: string): Song => {
  const data = LZString.decompressFromUTF16(input) ?? input;
  const firstComma = data.indexOf(",");
  
  let bpm: number;
  let sound: string;
  let str: string;

  if (data[firstComma + 1] === "[") {
    bpm = Number(data.slice(0, firstComma));
    sound = "snap";
    str = data.slice(firstComma + 1);
  } else {
    const secondComma = data.indexOf(",", firstComma + 1);
    bpm = Number(data.slice(0, firstComma));
    sound = data.slice(firstComma + 1, secondComma);
    str = data.slice(secondComma + 1);
  }

  const measures: Block[] = [];
  let i = 0;

  const parseBlock = (id: string): Block => {
    i++;
    
    if (str[i] === "[") {
      const left = parseBlock(id + "0");
      const right = parseBlock(id + "1");
      i++;
      return { id, text: "", left, right };
    }

    let text = "";
    while (i < str.length && str[i] !== "]") {
      text += str[i] === "\\" ? str[++i] : str[i];
      i++;
    }
    i++;
    
    return { id, text };
  };

  while (i < str.length) {
    measures.push(parseBlock(`${measures.length}-`));
  }

  return { bpm, sound, measures };
};