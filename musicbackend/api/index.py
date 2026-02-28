from fastapi import FastAPI
from ytmusicapi import YTMusic
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
ytmusic = YTMusic()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "Music API Running Successfully"}

@app.get("/search")
def search(q: str):
    results = ytmusic.search(q, filter="songs", limit=20)

    songs = []
    for item in results:
        songs.append({
            "title": item.get("title"),
            "artist": item.get("artists", [{}])[0].get("name"),
            "videoId": item.get("videoId"),
            "thumbnail": item.get("thumbnails", [{}])[-1].get("url")
        })

    return {"results": songs}

@app.get("/trending")
def trending():
    results = ytmusic.search("Indonesia Top Hits", filter="songs", limit=20)

    songs = []
    for item in results:
        songs.append({
            "title": item.get("title"),
            "artist": item.get("artists", [{}])[0].get("name"),
            "videoId": item.get("videoId"),
            "thumbnail": item.get("thumbnails", [{}])[-1].get("url")
        })

    return {"results": songs}
