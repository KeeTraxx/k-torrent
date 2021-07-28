port module Client.Main exposing (..)

import Browser
import Client.Models exposing (File, MagnetUriRequest, Model, Torrent, magnetUriRequestEncoder, torrentDecoder)
import Client.Util exposing (formatSeconds)
import Dict exposing (Dict)
import Filesize
import Html exposing (Attribute, Html, aside, button, col, colgroup, dd, dl, dt, footer, header, input, li, main_, progress, table, tbody, td, text, th, thead, tr, ul)
import Html.Attributes exposing (class, style, type_, value)
import Html.Events exposing (onClick, onInput)
import Http
import Json.Decode as Decode exposing (Error(..), decodeString, field, list)
import Round


main : Program () Model Msg
main =
    Browser.document { init = init, update = update, view = view, subscriptions = subscriptions }


port torrents : (String -> msg) -> Sub msg


init : () -> ( Model, Cmd Msg )
init _ =
    ( { torrents = Dict.empty
      , input = ""
      , inspect = Nothing
      }
    , Cmd.none
    )


type Msg
    = RecvTorrents String
    | AddTorrent
    | UpdateInput String
    | NoOp
    | NoOpResult (Result Http.Error ())
    | InspectTorrent Torrent
    | ClearInspect


setTorrents : List Torrent -> Model -> Model
setTorrents newTorrents model =
    { model | torrents = Dict.union (toDict newTorrents) model.torrents }


toDict : List Torrent -> Dict String Torrent
toDict newTorrents =
    Dict.fromList (List.map (\t -> ( t.name, t )) newTorrents)


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        RecvTorrents json ->
            case decodeString (list torrentDecoder) json of
                Ok newTorrents ->
                    ( setTorrents newTorrents model, Cmd.none )

                Err _ ->
                    ( model, Cmd.none )

        AddTorrent ->
            ( model, postMagnetURI { magnetURI = model.input } )

        UpdateInput newInput ->
            ( { model | input = newInput }, Cmd.none )

        NoOp ->
            ( model, Cmd.none )

        NoOpResult _ ->
            ( model, Cmd.none )

        InspectTorrent torrent ->
            ( { model | inspect = Just torrent.name }, Cmd.none )

        ClearInspect ->
            ( { model | inspect = Nothing }, Cmd.none )


postMagnetURI : MagnetUriRequest -> Cmd Msg
postMagnetURI magnetURI =
    Http.post
        { url = "/api/torrents"
        , body = magnetUriRequestEncoder magnetURI |> Http.jsonBody
        , expect =
            Http.expectWhatever NoOpResult
        }


errorMessage : Error -> String
errorMessage error =
    case error of
        Failure message _ ->
            message

        Field field nestedError ->
            "[" ++ field ++ "] : " ++ errorMessage nestedError

        Index index nestedError ->
            "[" ++ String.fromInt index ++ "] : " ++ errorMessage nestedError

        OneOf errorList ->
            List.map errorMessage errorList
                |> String.concat


view : Model -> Browser.Document Msg
view model =
    let
        inspectedTorrent : Maybe Torrent
        inspectedTorrent =
            findTorrent model.torrents model.inspect
    in
    { title = "test"
    , body =
        [ header [] [ input [ type_ "text", onEnter AddTorrent, onInput UpdateInput ] [] ]
        , main_ []
            [ table []
                [ colgroup []
                    [ col [ style "width" "40%" ] []
                    , col [ style "width" "5%" ] []
                    , col [ style "width" "5%" ] []
                    , col [ style "width" "20%" ] []
                    , col [ style "width" "5%" ] []
                    , col [ style "width" "5%" ] []
                    , col [ style "width" "5%" ] []
                    , col [ style "width" "5%" ] []
                    , col [ style "width" "5%" ] []
                    ]
                , thead []
                    [ th [] [ text "Name" ]
                    , th [] [ text "Size" ]
                    , th [] [ text "ETA" ]
                    , th [] [ text "Progress" ]
                    , th [] [ text "Downloaded" ]
                    , th [] [ text "DL" ]
                    , th [] [ text "Uploaded" ]
                    , th [] [ text "UL" ]
                    , th [] [ text "Ratio" ]
                    ]
                , tbody [] (List.map torrentHtml (markSelected (Dict.values model.torrents) inspectedTorrent))
                ]
            ]
        , aside
            [ class (return "visible" "hidden" model.inspect) ]
            (Maybe.withDefault [] (Maybe.map detailsHtml inspectedTorrent))
        , footer [] []
        ]
    }


markSelected : List Torrent -> Maybe Torrent -> List ( Torrent, Bool )
markSelected allTorrents toFind =
    List.map (\t -> ( t, Maybe.withDefault False (Maybe.map (\f -> f == t) toFind) )) allTorrents


return : b -> b -> Maybe a -> b
return true false maybe =
    case maybe of
        Just _ ->
            true

        Nothing ->
            false


findTorrent : Dict String Torrent -> Maybe String -> Maybe Torrent
findTorrent allTorrents torrentName =
    Maybe.andThen (\name -> Dict.get name allTorrents) torrentName


detailsHtml : Torrent -> List (Html Msg)
detailsHtml torrent =
    [ button [ onClick ClearInspect ] [ text "close" ]
    , dl []
        [ dt [] [ text "name" ]
        , dd [] [ text torrent.name ]
        , dt [] [ text "downloaded" ]
        , dd [] [ text (torrent.downloaded |> Filesize.format) ]
        , dt [] [ text "size" ]
        , dd []
            [ text
                (case torrent.length of
                    Nothing ->
                        "n/a"

                    Just l ->
                        l |> Filesize.format
                )
            ]
        , dt [] [ text "peers" ]
        , dd [] [ text (String.fromInt torrent.numPeers) ]
        , dt [] [ text "path" ]
        , dd [] [ text torrent.path ]
        , dt [] [ text "progress" ]
        , dd [] [ text (Round.round 2 (torrent.progress * 100) ++ "%") ]
        , dt [] [ text "timeRemaining" ]
        , dd []
            [ text (naMaybe formatSeconds torrent.timeRemaining) ]
        , ul [] (List.map fileHtml torrent.files)
        ]
    ]


fileHtml : File -> Html Msg
fileHtml file =
    li []
        [ dl []
            [ dt [] [ text "name" ]
            , dd [] [ text file.name ]
            , dt [] [ text "downloaded" ]
            , dd [] [ text (file.downloaded |> Filesize.format) ]
            , dt [] [ text "progress" ]
            , dd [] [ text (Round.round 2 (file.progress * 100) ++ "%") ]
            ]
        ]


torrentHtml : ( Torrent, Bool ) -> Html Msg
torrentHtml ( torrent, selected ) =
    tr
        [ onClick (InspectTorrent torrent)
        , class
            (if selected then
                "selected"

             else
                ""
            )
        ]
        [ td
            [ class "name" ]
            [ text torrent.name ]
        , td [ class "length" ] [ text (naMaybe Filesize.format torrent.length) ]
        , td [ class "eta" ] [ text (naMaybe formatSeconds torrent.timeRemaining) ]
        , td [ class "progress" ] [ progress [ value (Round.round 2 (torrent.progress * 100)), Html.Attributes.max "100" ] [] ]
        , td [ class "downloaded" ] [ text (torrent.downloaded |> Filesize.format) ]
        , td [ class "downloadSpeed" ] [ text ((torrent.downloadSpeed |> round |> Filesize.format) ++ "/s") ]
        , td [ class "uploaded" ] [ text (torrent.uploaded |> Filesize.format) ]
        , td [ class "uploadSpeed" ] [ text ((torrent.uploadSpeed |> round |> Filesize.format) ++ "/s") ]
        , td [ class "ratio" ] [ text (naMaybe (Round.round 2) torrent.ratio) ]
        ]


naMaybe : (a -> String) -> Maybe a -> String
naMaybe f maybe =
    case maybe of
        Just a ->
            f a

        Nothing ->
            "n/a"


onEnter : msg -> Attribute msg
onEnter msg =
    Html.Events.on "keyup"
        (Decode.field "key" Decode.string
            |> Decode.andThen
                (\key ->
                    if key == "Enter" then
                        Decode.succeed msg

                    else
                        Decode.fail "Not the enter key"
                )
        )


subscriptions : Model -> Sub Msg
subscriptions _ =
    torrents RecvTorrents
