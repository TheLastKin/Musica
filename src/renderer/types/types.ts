type Media = {
    name: string,
    path: string,
    duration: number,
}
type Playlist = {
    name: string,
    medias: Media[]
}

type TimeStamp = {
    atTime: number,
    note: string,
}

export { Media, Playlist, TimeStamp };