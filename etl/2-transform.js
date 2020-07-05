// This script will extract data from the aves-raw
// and remove unwanted html inside the data
// use as npm transform > birds.json
const cheerio = require("cheerio");

const transformInfo = (item) => {
  const infoRaw = item.info;

  const keyNames = {
    "Nombre en Inglés": "name",
    Dimorfismo: "dimorfism",
    Migratoria: "migration",
    Longitud: "size",
    "Ubicación geográfica": "geo",
    Orden: "order",
    Especie: "species",
    "Conservación según IUCN": "iucn",
  };

  const elements = infoRaw
    .split("<br>")
    .map((item) =>
      item
        .trim()
        .split(":")
        .map((ele) => ele.trim())
    )
    .map((item) => {
      let name = "";
      let value = "";

      if (item[0]) {
        const $name = cheerio.load(item[0]);
        name = $name.text().trim();
      }

      if (item[1]) {
        const $value = cheerio.load(item[1]);
        value = $value.text().trim();
      }

      return {
        name,
        key: keyNames[name],
        value,
      };
    });

  const info = {};

  elements.forEach((element) => {
    info[element.key] = element;
  });

  return info;
};

const transformAudio = (item) => {
  const audio = {};
  if (item.audio.src) {
    const author = item.audio.author;

    audio.author = author.substring(
      author.indexOf("Author: Author ") + "Author: Author ".length,
      author.length
    );

    audio.src = item.audio.src;
    audio.type = item.audio.type;

    if (audio.type === "audio/wav") {
      audio.ext = "wav";
    }

    const name = audio.src.substring(
      audio.src.indexOf("/img/") + 5,
      audio.src.length
    );

    audio.name = name;
    audio.filename = `${name}.${audio.ext}`;
  }

  return audio;
};

const transformNames = (item, info) => {
  const names = {
    spanish: item.name,
    latin: item.latin
      .substring(item.latin.indexOf("(") + 1, item.latin.length - 1)
      .trim(),
    english: "",
  };

  names.english = info.name.value;
  return names;
};

const removeTableStyles = (text) => {
  const needle = "/* Style Definitions */";
  const initial = text.indexOf(needle);

  if (initial > 0) {
    return text.substring(0, initial).trim();
  }

  return text;
};

const transformToText = (text) => {
  const $ = cheerio.load(text);
  return removeTableStyles($.text().trim());
};

const transformDescription = (item) => transformToText(item.description);

const transformHabitat = (item) => transformToText(item.habitat);

const transformEndangered = (item) => transformToText(item.endangered);

const transformDidYouKnow = (item) => transformToText(item.didyouknow);

const transformImage = (image) => {
  const route = "/img/";

  const path = image.substring(0, image.indexOf(route) + route.length);

  const filename = image.substring(
    image.indexOf(route) + route.length,
    image.length
  );

  let ext = filename.substring(filename.length, filename.length - 3);
  let name = filename.substring(0, filename.length - 4);

  // some images does not have extension
  if (filename.indexOf(".jpg") < 0) {
    name = filename;
    ext = "jpg";
  }

  return {
    url: image,
    uri: path,
    filename,
    name,
    ext,
  };
};

const getUid = (item, names) => {
  const uid = item.id + "-" + names.latin.toLowerCase().replace(" ", "-");
  return uid;
};

const birds = [];

const raw = require("../data/birds-raw.json");

raw.forEach((item) => {
  const audio = transformAudio(item);
  const info = transformInfo(item);
  const names = transformNames(item, info);
  const description = transformDescription(item);
  const habitat = transformHabitat(item);
  const endangered = transformEndangered(item);
  const didyouknow = transformDidYouKnow(item);

  const bird = {
    id: Number(item.id),
    uid: getUid(item, names),
    map: item.map,
    image: transformImage(item.image),
    gallery: item.gallery.map((image) => transformImage(image)),
    names,
    audio,
    info,
    description,
    habitat,
    iucn: endangered,
    didyouknow,
  };

  birds.push(bird);
});

const sortedBirds = birds.sort((a, b) => a.id < b.id);
console.log(JSON.stringify(sortedBirds));
