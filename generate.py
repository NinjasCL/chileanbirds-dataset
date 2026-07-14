import json 
import os
import shutil
import subprocess

def read_or_empty(data, key, default=""):
  return data.get(key, default)

def image_filename(image):
  name = os.path.splitext(read_or_empty(image, "filename"))[0]
  ext = os.path.splitext(read_or_empty(image, "filename"))[1]
  if ext == "":
    ext = ".jpg"
  return name + ext

def sanitize_uid(uid):
  return uid.replace("(", "").replace(")", "").replace(" ", "")

def prepare_bird(item, index = 0):
  data = item["data"]
  uid = sanitize_uid(data["uid"])
  bird = {
    "sort": index,
    "id": data["id"],
    "uid": uid,
    "meta": {
      "uid": data["uid"]
    },
    "uri": f"{uid}/data.json",
    "names" : {
      "es": data["names"]["spanish"],
      "en": data["names"]["english"],
      "la": data["names"]["latin"]
    },
    "keywords": f"{data["id"]} {data["names"]["spanish"]} {read_or_empty(data["names"], "english")} {data["names"]["latin"]}".lower().strip(),
    "about": {
      "habitat": read_or_empty(data, "habitat").strip(), 
      "description": read_or_empty(data, "description").strip(),
      "didyouknow": read_or_empty(data, "didyouknow").strip(),
      "geo": read_or_empty(data["info"]["geo"], "value").strip()
    },
    "info": {
      "order": read_or_empty(data["info"]["order"], "value").strip(),
      "size": read_or_empty(data["info"]["size"], "value").strip(),
      "species": read_or_empty(data["info"]["species"], "value").strip(),
      "iucn": read_or_empty(read_or_empty(data["info"], "iucn", {}), "value").strip(),
      "dimorfism": read_or_empty(data["info"]["dimorfism"], "value", default="No").strip(),
      "migration": read_or_empty(data["info"]["migration"], "value", default="No").strip(),
    },
    "media": {
      "image": {
        "name": os.path.splitext(read_or_empty(data["image"], "filename"))[0],
        "ext": os.path.splitext(read_or_empty(data["image"], "filename"))[1],
        "filename": image_filename(data["image"])
      },
      "audio": {
        "file": read_or_empty(data["audio"], "filename"),
        "author": read_or_empty(data["audio"], "author").strip()
      },
    }
  }
  return bird

def main():
  file = open("data/birds-full.json", "r", encoding="utf-8")
  data = json.load(file)
  birds = sorted(data, key = lambda x: x["data"]["id"])

  out = "dist"

  shutil.rmtree(out, ignore_errors=True)
  os.mkdir(out)

  small_dataset = []

  for index, item in enumerate(birds):
    bird = prepare_bird(item, index)
    uid = bird.get("meta").get("uid")
    bird_origin = os.path.abspath(os.path.join("./assets", uid))
    
    bird_out = os.path.abspath(os.path.join(out, bird.get("uid")))
    os.mkdir(bird_out)
    
    # Copy image
    media = bird.get("media")
    image = media.get("image")
    filename = image.get("filename")

    image_origin = os.path.join(bird_origin, filename)
    image_in = os.path.abspath(os.path.join(bird_out, filename))
    image_out = os.path.abspath(os.path.join(bird_out, "image.jpg"))
    image_thumb = os.path.abspath(os.path.join(bird_out, "thumb.jpg"))

    shutil.copy2(image_origin, image_in)

    # Standarize size and extension
    subprocess.run(["magick", image_in, image_out], text=True)
    subprocess.run([
      "magick", image_in, 
      "-thumbnail", "240x240^", 
      "-gravity", "center", 
      "-extent", "240x240" ,
      image_thumb], text=True)

    os.remove(image_in)

    # Copy wav
    audio = media.get("audio").get("file")
    author = media.get("audio").get("author")

    # Use the final names
    bird["media"] = {
          "map": f"map.svg",
          "data": f"data.json",
          "image": f"image.jpg",
          "thumb": f"thumb.jpg",
          "audio": {
            "file": "",
            "author": "Unknown"
          }
    }

    if audio != "":
      wav_origin = os.path.abspath(os.path.join(bird_origin, audio))
      wav_out = os.path.abspath(os.path.join(bird_out, "audio.wav"))
      shutil.copy2(wav_origin, wav_out)
      bird["media"]["audio"] = {
        "file": "audio.wav",
        "author": author
      }
    
    # Copy map
    map_origin = os.path.abspath(os.path.join(bird_origin, "map.svg"))
    shutil.copy2(map_origin, bird_out)

    # Write data.json
    bird_json = open(os.path.abspath(os.path.join(bird_out, "data.json")), "w", encoding="utf-8")
    bird_json.write(json.dumps(bird))
    bird_json.close()

    # Add to small dataset
    small_dataset.append({
      "uid": bird.get("uid"),
      "uri": bird.get("uri"),
      "sort": bird.get("sort"),
      "image": bird.get("media").get("image"),
      "thumb": bird.get("media").get("thumb"),
      "keywords": bird.get("keywords"),
      "names": {
        "es": bird.get("names").get("es"),
        "en": bird.get("names").get("en"),
        "la": bird.get("names").get("la")
      }
    })

  # Write Index
  index_json = open(os.path.abspath(os.path.join(out, "index.json")), "w", encoding="utf-8")
  index_json.write(json.dumps(small_dataset))
  index_json.close()
    


if __name__ == "__main__":
  main()