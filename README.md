# FAO Malawi Digital M&E System — MVP v9

This release fixes a browser-startup issue that could result in a blank page when opening the system from a local OneDrive/Windows file path. It also safely handles corrupted or unavailable browser local storage and provides a reset option if startup data becomes invalid.

## Opening the system
1. Extract the ZIP file.
2. Open `digital_me_system/index.html` in Edge or Chrome.
3. If the browser shows a startup error, use **Reset local application data and reload**.

The system remains a browser-based prototype. Data are stored locally in the browser; this is not yet a multi-user server database.


## v11 updates
- Fixed Support Area cascading selection so the selected Technical Support no longer resets the Support Area.
- Added automatic Male + Female gender total in beneficiary data entry.
- Added beneficiary dashboard breakdown by Technical Support and Support Area.
- Added checkbox-based project implementation district selection in Administration.


## v13 updates
- Centered KPI ribbon text and added lightweight icons.
- Added performance colour coding to the % achieved KPI using green ≥75%, amber 50–74.9%, red <50%.


## v14 updates
- Results Framework dashboard KPI ribbon changed to Total Indicators, Indicators with Data, Indicators Achieved, Indicators on Track, Indicators Off-Track, and Indicators with no Data.
- Results performance thresholds are now green ≥75%, amber 50–<75%, red <50%.
- Results legend moved below the KPI dashboard and immediately before the indicator performance table.
