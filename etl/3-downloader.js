const { DownloaderHelper } = require("node-downloader-helper");
const fs = require("fs").promises;

const wait = async (ms = 300) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(true), ms);
  });

const downloadFiles = async ({ url = "", path = "", filename = null }) => {
  const options = {
    method: "GET",
    headers: {
      "User-Agent":
        "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:78.0) Gecko/20100101 Firefox/78.0",
    },
    override: true,
    removeOnFail: false,
    retry: {
      maxRetries: 5,
      delay: 5000,
    },
  };

  if (filename) {
    options.fileName = filename;
  }

  console.log("Downloading", url);

  const download = new DownloaderHelper(url, path, options)
    .on("progress", (stats) => {
      if (stats.progress % 50 == 0) {
        console.log(stats.progress);
      }
    })
    .on("stateChanged", (state) => {
      // console.log("state", state);
    })
    .on("error", (error) => {
      console.error(error);
    })
    .on("finished", (info) => {
      console.log(info);
    })
    .start();

  return download;
};

const writeBirdInfo = async ({ bird, path }) => {
  await fs.writeFile(path + bird.uid + ".json", JSON.stringify(bird));
};

const birds = require("../data/birds.json");
const json = [];

const main = async () => {
  const path = __dirname + "/../assets/";

  for (const bird of birds) {
    const bird_path = path + bird.uid + "/";

    const jsonBird = {
      data: bird,
      gallery: [],
    };

    try {
      await fs.mkdir(bird_path);
    } catch (_) {
      console.log("Directory", bird.uid, "already exists. Ommiting");
      continue;
    }

    await writeBirdInfo({ bird, path: bird_path });

    console.log("\nBird", bird.uid);
    console.log("Downloading Main Image");
    const mainImage = {
      url: bird.image.url,
      path: bird_path,
    };
    await downloadFiles(mainImage);

    jsonBird.image = {
      name: bird.image.name,
      ext: bird.image.ext,
    };

    await wait();

    console.log("Downloading Gallery");
    for (const image of bird.gallery) {
      const item = {
        url: image.url,
        path: bird_path,
        filename: {
          name: image.name,
          ext: image.ext,
        },
      };
      await downloadFiles(item);
      jsonBird.gallery.push(item.filename);
      await wait();
    }

    await wait();

    jsonBird.audio = {};
    if (bird.audio.src) {
      console.log("Downloading Audio");
      const audio = {
        url: bird.audio.src,
        path: bird_path,
        filename: {
          name: bird.audio.name,
          ext: bird.audio.ext,
        },
      };
      await downloadFiles(audio);
      jsonBird.audio = audio.filename;
    }

    await wait();

    console.log("Downloading Map");
    const map = {
      url: bird.map.svg,
      path: bird_path,
      filename: {
        name: "map",
        ext: "svg",
      },
    };

    await downloadFiles(map);

    jsonBird.map = map.filename;

    json.push(jsonBird);

    await wait(1500); // ms
  }

  await fs.writeFile(
    __dirname + "/../data/birds-full.json",
    JSON.stringify(json)
  );
};

main()
  .then(() => {
    console.log("Done");
  })
  .catch((error) => {
    console.error(error);
  });
