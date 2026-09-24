# Plex / Tautulli / Nostalgia TV Session Record

Date: 2026-09-23  
Repository: `https://github.com/nickhilster/plex-media-workflows`  
Local project: `C:\plex-mcp`

> This is a reconstructed operational transcript and decision log, not a verbatim export of the ChatGPT conversation. The desktop thread API exposed turn metadata but not the complete message bodies. Secrets, tokens, API keys, cookies, credentials, and runtime databases are intentionally excluded.

## Objective

Build and test a local media workflow:

```text
Plex Media Server → Nostalgia TV channel generator → M3U/XMLTV or HDHomeRun → TiviMate or Plex Live TV
```

The bridge is intended for casual channel surfing. Normal Plex library playback remains the path for deliberate viewing and full home-theater audio.

## Local services and addresses

- Plex Media Server: local Windows installation, normally `127.0.0.1:32400`.
- Nostalgia TV Docker server: `192.168.1.103:19850`.
- TiviMate M3U: `http://192.168.1.103:19850/channels.m3u`.
- TiviMate XMLTV: `http://192.168.1.103:19850/xmltv.xml`.
- Plex-compatible HDHomeRun address: `192.168.1.103`.
- Plex-compatible XMLTV address: `http://192.168.1.103/xmltv.xml`.

The host address is a LAN address, not a special Nostalgia TV address. A router DHCP reservation is recommended so it remains stable.

## Existing project state

The repository already contained the Plex/Docker/Nostalgia setup. Runtime state remains excluded from Git, including:

- `.env` and credentials
- Tautulli configuration
- Nostalgia TV data/config/logos
- databases and SQLite files
- exports and logs

## Nostalgia TV configuration

The Docker service uses the persistent directories under `C:\plex-mcp\nostalgia` and has `restart: unless-stopped`.

The service was verified online with Plex connected and the channel schedule successfully rebuilt. The Docker image was Nostalgia TV server v0.10.8.

## Existing and created channels

Existing test/personal channels retained:

| Number | Channel | Source / purpose |
|---:|---|---|
| 2001 | Nostalgia TV - The Simpsons | Plex playlist |
| 2002 | Nostalgia TV - Last Week Tonight | Plex playlist |
| 2003 | Nostalgia TV - Top TV Mix | Plex playlist |
| 2004 | Watched Movies | Plex collection |
| 2005 | 4K Movies | Plex collection |
| 2006 | Animated Favs | Animation criteria |
| 2007 | Adult Animation | Adult Animation criteria |
| 2008 | ReRuns | Plex collection `ReRuns` |

Additional TV-oriented channels created:

| Number | Channel | Initial source / schedule |
|---:|---|---|
| 2009 | Comfort TV | ReRuns collection |
| 2010 | Sitcom Central | Comedy genre |
| 2011 | Animated ReRuns | Animation genre |
| 2012 | Late Night | ReRuns-based rotation |
| 2013 | Prime Time Mix | ReRuns collection, four-episode blocks |
| 2014 | Deep ReRuns | ReRuns collection, alternate rotation |
| 2015 | Recently Watched | ReRuns-based rotation |
| 2016 | Short-Form TV | ReRuns collection, short block setting |
| 2017 | Weekend TV | ReRuns collection, six-episode blocks |
| 2018 | Travel & Documentaries | Documentary and Travel genres |
| 2019 | Travel & Documentary — Alternate | Same genres, block-shuffle schedule |
| 2020 | Story Arc TV | Drama/crime/thriller/mystery/sci-fi/fantasy/adventure/action criteria |
| 2021 | Story Arc — Marathon | Same story-arc pool, marathon rotation |
| 2022 | Story Arc — Block Rotation | Same story-arc pool, four-episode blocks |

The ReRuns channel was audited before extending it. It is a manually maintained Plex collection containing approximately 11 familiar shows and about 1,262 episodes, including 30 Rock, Angie Tribeca, Brooklyn Nine-Nine, Community, Coupling, Friends, How I Met Your Mother, Modern Family, Superstore, Trailer Park Boys, and Who Is America?. It remains the personal comfort channel.

## Channel schedule results

The schedule was rebuilt through the Nostalgia TV API. At the time of testing, the server reported:

- 22 active channels
- approximately 32,130 scheduled programmes
- zero channel-generation failures

The travel/documentary pool resolved to approximately 80 shows and 246 episodes.

The story-arc criteria were intentionally broad because Nostalgia TV filters on Plex metadata. The pool included serialized titles such as Better Call Saul, Chernobyl, Dexter, Dark Matter, Band of Brothers, and similar content. It may still include procedural or comedy-adjacent titles and should be refined later with a dedicated Plex collection if needed.

## TiviMate path

TiviMate was configured with the Nostalgia TV M3U and XMLTV URLs. Testing showed:

- channels load successfully;
- EPG data loads after schedule refresh;
- channel playback recovers from intermittent interruptions;
- 4K content is reported as 4K by TiviMate in the tested path;
- 5.1 audio was confirmed by the receiver on suitable direct M3U content.

The working path is:

```text
Plex → Nostalgia TV → M3U/XMLTV → TiviMate
```

## Plex Live TV/DVR path

Nostalgia TV exposes an HDHomeRun-compatible discovery endpoint. Plex initially could not add `192.168.1.103` because the service was only exposed on port 19850. Port 80 was added as a compatibility mapping:

```yaml
ports:
  - "80:19850"
  - "19850:19850"
```

Verified endpoints after the change:

- `http://192.168.1.103/discover.json` → HTTP 200
- `http://192.168.1.103/lineup.json` → HTTP 200, 22 channels
- `http://192.168.1.103/xmltv.xml` → HTTP 200

Plex successfully added the virtual tuner and guide. The Plex Android TV client required a restart before the Live TV source appeared.

The working path is:

```text
Plex Media Server → Nostalgia TV HDHomeRun interface → Plex Live TV → Android TV
```

Plex describes playback as a “Recording Live TV Session” because it is treating the source as a DVR/tuner.

## Plex resolution and audio findings

For a known 4K Spider-Man source, Plex’s active-session API reported:

- source file in Plex library: 3840-wide 4K HEVC;
- Plex Live TV session: 1280×720 H.264;
- Plex decision: Direct Play;
- audio: AAC, 2 channels, stereo;
- Nostalgia request after configuration change: `transcode=none`.

The Plex DVR setting was changed from the heavy transcoder profile to Original format. That removed the forced heavy request, but the HDHomeRun-compatible Nostalgia path still reported a 720p H.264 stereo stream to Plex.

The DVR Resolution setting only offers Prefer HD and HD only. It controls recording selection and does not create a 4K tuner stream. Prefer HD is safer for this virtual tuner.

Important conclusion:

- The Plex Live TV path is visually good and stable enough for channel surfing.
- Its technical metadata reports 720p and stereo AAC.
- TiviMate’s direct M3U path reports 4K where expected and preserved 5.1 audio in testing.
- Normal Plex library playback preserves the original 4K/5.1 source and remains the correct path for home-theater viewing.

“Direct Play” in Plex means Plex is directly playing the stream received from the tuner; it does not prove that the original 4K source survived the tuner layer.

## One-click recovery launcher

Created:

- `C:\plex-mcp\scripts\nostalgia-tv-repair.ps1`
- Desktop shortcut: `Nostalgia TV Repair.lnk`

The launcher starts Docker Desktop, starts the Nostalgia TV container, waits for Plex connectivity, refreshes the library and schedule, verifies M3U/XMLTV HTTP responses, and writes a temporary repair log. It does not delete or rebuild persistent channel configuration.

## Git history added during the session

- `30754c2 Add one-click Nostalgia TV recovery launcher`
- `2e8b294 Expose Nostalgia TV tuner on HDHomeRun default port`

Remote repository:

`https://github.com/nickhilster/plex-media-workflows`

## Lessons and future guidance

1. Use TiviMate’s direct M3U path when 4K and 5.1 audio matter.
2. Use Plex Live TV when native Plex channel surfing and guide integration matter.
3. Use normal Plex library playback for intentional movie viewing and full audio/video fidelity.
4. Do not confuse Plex’s “Direct Play” label with original-source resolution.
5. Plex’s DVR Resolution setting is not a 4K playback control.
6. Nostalgia TV is the channel generator and schedule engine; it remains required in every path.
7. Keep the host IP stable with a router DHCP reservation.
8. ReRuns is intentionally personal and should remain unchanged unless explicitly requested.
9. Metadata-based genre filters are broad; precise channel identities should use Plex collections/playlists managed through the Plex API.
10. Future API work should be idempotent and should audit existing collections/channels before changing them.

## Not completed / not claimed

- No claim that Plex Live TV can preserve 4K or 5.1 through the HDHomeRun compatibility path.
- No claim that every genre-based channel contains only serialized shows.
- No Nostalgia TV uninstall was performed.
- No runtime databases or secrets were committed.
