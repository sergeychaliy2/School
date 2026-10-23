# Сборка Расписания для Google Play (.aab)

Expo / React Native, пакет `ru.novoselicy.schedule`, версия 1.2.0 (versionCode 2).

## Подпись

Релизная подпись читается из `android/keystore.properties` (в git не попадает):

```
storeFile=app/upload-key.jks
storePassword=…
keyAlias=upload
keyPassword=…
```

Ключ `app/upload-key.jks` и пароли храни отдельно (бэкап). Нет файла —
`android/app/build.gradle` собирает debug-подписью.

## Важно на Windows: CMake 3.31+

Нативные модули (react-native-reanimated/worklets) с **CMake 3.22.1** из
Android SDK на Windows падают с `ninja: error: manifest 'build.ninja' still
dirty after 100 tries` (известный баг CONFIGURE_DEPENDS). Нужен **CMake ≥ 3.24**:

1. Скачать CMake 3.31.x (cmake.org), распаковать.
2. Скопировать `ninja.exe` из `<SDK>/cmake/3.22.1/bin` в `bin` нового CMake
   (standalone CMake ninja не содержит).
3. В `android/local.properties`: `cmake.dir=C:/path/to/cmake-3.31.x-windows-x86_64`

На Linux/macOS (в т.ч. облачная сборка EAS) проблемы нет.

## Сборка

```
cd android && ./gradlew bundleRelease
```
Результат: `android/app/build/outputs/bundle/release/app-release.aab`.

Либо облаком: `eas build -p android --profile production` (нужен вход в Expo).
