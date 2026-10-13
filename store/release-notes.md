# Release notes

Una release por fichero, con **solo** los bloques `<en-US>`/`<es-ES>` de esa
versión, listos para pasar a Play con `--notes`:

```bash
node ~/.config/opencode/skills/google-play-console/scripts/play.mjs upload \
  --bundle android/app/build/outputs/bundle/release/app-release.aab \
  --track alpha \
  --notes store/release-notes/1.6.0.md \
  --name "1.6.0" \
  --mapping android/app/build/outputs/mapping/release/mapping.txt
```

Al añadir una versión nueva, crea `store/release-notes/<version>.md` con sus
bloques y enlázala aquí.

- [1.6.1 (versionCode 14)](release-notes/1.6.1.md)
- [1.6.0 (versionCode 13)](release-notes/1.6.0.md)
- [1.5.0 (versionCode 12)](release-notes/1.5.0.md)
- [1.4.1 (versionCode 11)](release-notes/1.4.1.md)
