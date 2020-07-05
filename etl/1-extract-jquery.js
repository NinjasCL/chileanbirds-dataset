// Use this script inside http://www.buscaves.cl home page
// parsed on July 3th 2020
await (async () => {
  const parseBird = (url, data) => {
    console.log("Parsing");

    // Load the external html inside the current
    // page in order to enable using jquery
    const html = $("footer").html(data);

    const base = "http://www.buscaves.cl";
    const mapBase = base + "/images/";

    const mapUrl = $('footer img[atl="Mapa Busca Aves Chile"]').attr("src");
    const aveParam = "?ave=";
    const birdId = mapUrl.substring(
      mapUrl.indexOf(aveParam) + aveParam.length,
      mapUrl.length
    );

    const gallery = [];
    $("footer a.highslide").each((index, item) => {
      gallery.push(base + $(item).attr("href"));
    });

    const audio = $("footer #audio")[0];
    let audioInfo = { src: null, type: "", author: "" };
    if (audio) {
      const audioAuthor = $("footer #audio").prev("img").attr("title");
      audioInfo = {
        src: base + "/" + audio.lastElementChild.attributes.src.nodeValue,
        type: audio.lastElementChild.attributes.type.nodeValue,
        author: audioAuthor,
      };
    }

    const bird = {
      id: birdId,
      url,
      name: $("footer h1 strong").html(),
      latin: $("footer h3 i").html(),
      image: base + $("footer table img").attr("src"),
      gallery,
      map: {
        svg: mapBase + "svg.php" + aveParam + birdId,
      },
      description: $("footer #descripcioGeneral").html(),
      habitat: $("footer #habitatDistribucion").html(),
      endangered: $("footer #amenazaConservacion").html(),
      info: $("footer h3.subituloAve").next().find("p").html(),
      didyouknow: $("footer #sabiasQue").html(),
      audio: audioInfo,
    };

    console.log(bird);
    return bird;
  };

  const wait = async (ms) =>
    new Promise((resolve) => {
      setTimeout(() => resolve(true), ms);
    });

  const getBird = async (url) => {
    return new Promise((resolve) => {
      console.log("Downloading", url);
      $.get(url, (data) => {
        console.log("Downloaded");
        return resolve(parseBird(url, data));
      });
    });
  };

  const birdUrls = [];
  $(".buscar a").each((index, item) => {
    const href = $(item).attr("href");
    const birdUrl = "http://www.buscaves.cl/" + href;
    birdUrls.push(birdUrl);
  });

  const birds = [];
  for (const birdUrl of birdUrls) {
    const bird = await getBird(birdUrl);
    birds.push(bird);
    // wait before each request to not overload the server
    await wait(1500);
  }

  console.log(birds);

  // This is the contents of aves-raw.json
  console.log(JSON.stringify(birds));
})();
