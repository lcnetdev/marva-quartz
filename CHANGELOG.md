# Changelog

All notable changes to this project will be documented in this file.

## [1.3.5   ] - 2025-06-03
### Updated
- Changes behavior of the load screen LCCN search input box. You only will see the LCCN number there no URL, also adds default profile that can be changed so you can just press enter to load using that profile.

## [1.3.4   ] - 2025-06-02
### Fixes
- The preview NAR button in the NAR modal will check its state better, before it could be "locked" disabled.


## [1.3.3   ] - 2025-05-30
### Updated
- When there is a non-latin agent with no non-latin literals in the file it will not build the non-latin labels and marcKeys this update lets you force it to from the non-latin agent tool modal


## [1.3.2   ] - 2025-05-30
### Updated
- Updated the NAR interface advanced mode to have textarea resizable subfield text fields and start off the field with a "$"

## [1.3.1   ] - 2025-05-27
### Added
- "Quick View" feature added to Marva


## [1.3.0] - 2025-05-21
### Added
- CopyCat UI to Marva

### Fixes
- Sometimes mangled relationships in Marva



## [1.2.28] - 2025-05-21
### Changed
- How admin metadata is added to records to support IBC records
- Load Show All Stats now only shows the first 1000 records with a button to show all
### Add
- Create Quick Hub modal now has a reset button
- Create Quick Hub modal will save inputed data when closed ( x button, cancel button, click outside modal) and repopulate that data when opened again. It clears saved data when Hub is posted.
### Fix
- Load Show All Stats page did not work correctly on Firefox.

## [1.2.27] - 2025-05-19
### Fix
- Closing the NAR modal without posting would lose the Advanced NAR rows. It now saves them.
- Voyager diacritic entry mode not being seen as a change.

### Update
- Create NAR cleans up the MARC Key to flip 7xx and truncate $e or $4
- Adds reset button to create NAR
- Adds ability to overwrite MARCKey with search value from complex search modal
- Paired literal improvements: Draws lines when there are +2 literals, tries to sort literals into pairs better.

## [1.2.26] - 2025-05-15
### Update
- Added remove row buttons to advanced NAR mode.
- Added sorting to XML so the MARC XML produced from NAR creation will sort correctly in voyager display

### Add
- Added diacritic support to advanced NAR mode.


## [1.2.23] - 2025-05-06
### Update
- How `indirect geo` can be entered to account for more usecases

### Add
- [BFP-391] Local Marva validation to check that `type` is set


## [1.2.22] - 2025-05-02
### Update
- Hub URIs from hub creation
- Complex Search Details

### Add
- Ability to populate Class Numbers from Complex Search Details

### Fix
- Prompt to login when click ClassWeb link in Complex Search Details


## [1.2.21] - 2025-04-30
### Changed
- Prevent `Insert Default Values` from removing existing data
- Added Advanced NAR mode to NAR modal.

### Fixed
- Fix `bf:duration` causing Marva to crash


## [1.2.18] - 2025-04-28
### Added
- Manual override for RBMS to support dual LCGFT/RBMS lookup


## [1.2.16] - 2025-04-23
### Changed
- Final page message is less cryptic
- Order of Hubs in subject search


## [1.2.15] - 2025-04-22
### Fix
- Issue with usage sorting selecting the wrong entry

### Changed
- Move `Hub` left of `Works` in lookups
- How pagination deals with getting no results

### Added
- Support for usage statistics from Suggest2


## [1.2.14] - 2025-04-21
### Fixed
- Not being able to load resource without subjects


## [1.2.12] - 2025-04-18
### Fixed
- Custom Order changing the order of fields when records are loaded in

### Changed
- Make sure that subjects are grouped by source with LCSH terms first
- Show value of Classification components in property panel


## [1.2.11] - 2025-04-17
### Added
- Ability to find and use complex subdivisions in the subject builder

### Fixed
- Fix `Jurisdictions` being of type `Organization`


## [1.2.10] - 2025-04-15
### Changed
- NAR modal populates `670 $b` with statement of responsibilty when possible
- NAR modal layout change

## [1.2.9] - 2025-04-14
### Fixed
- Typo in preferences

### Changed
- Update indicators in NAR template
- How the NAR modal gets a value
- Removed preference that doesn't do anything
- Hub modal layout


## [1.2.8] - 2025-04-10
### Fixed
- Fixed XML created for `Creator characteristic`


## [1.2.7] - 2025-04-09
### Fixed
- Paired latin/non-latin indicators showing up in some drop down menus
- AdminMD components could "generate" a new admin field [BFP-382]
- Fix `GeoCoverage` swapping to non-lating form when `Paired literals...` preference is set
- Fix auto dewey logic
- Fix Double `|x` appearing with `Biograpahy` in linked subject input

### Changed
- Update to Default Library `Index` & `Bib` [BFP-381]
- Change the XML structure of `ComplexSubjects`
- Add Complex Lookup for LCDGT - `Creator Characteristic`
- Sort of Names in subject results to be based on shown label
- Change display of labels with `USE` to keep emphasis on the authorized term. `A (USE B)` > `B (USE FOR A)`


## [1.2.6] - 2025-04-08
## Fixed
- Broken property navigation for items


## [1.2.5] - 2025-04-07
### Fixed
- Improved complex subject lookups

### Changed
- `Left Anchored` search options appear before `Keyword` in complex lookups


## [1.2.4] - 2025-04-04
### Changed
- Update Default library components: `Bib/Index`, `Color Ill., Color Map`, `Index` [BFP-370]
- Remove icon from default component items

## [1.2.3] - 2025-04-03
### Fixed
- Improved custom order work with changes to profiles
- Improved custom order when profile components don't match
- Fix custom ordering removing AdminMetadata

## [1.2.2] - 2025-04-02
### Added
- Feature: Ability to set and save the order components appear in Marva [BFP-327]
- Feature: Continuous scrolling in Shelf Listing

## [1.1.1] - 2025-04-01
### Fixed
- Hub subjects not being `bf:Hub`
- Hub subjects not appearing in Marva
- CYAC headings not splitting up


## [1.1.0] - 2025-03-31
### Added
- Ability to copy a contributor into a subject field [BFP-350]
- Ability to add create a Hub as subject.
- Beta testing ability to create NAR records added as staging feature
- Added Auto Save preference in Preferences -> General

### Changed
- Adds more detail display for Entities when searching (Hubs, names, etc.)
- Added Variant title option to Hub creation modal with Scriptshifter support [BFP-347]
- Simple lookups have the code "Author (aut)" removed from the label when selected
- Simple lookups have been limited to Eng lang

### Fixed
- Improved building of Hubs
- Improved subject heading building
- Improved suggest2/ API integration
- Fix not being able to add literals to complex lookups
- Fixed Input Transcriped Series would be labeled as bflc:Uncontrolled
- Fixed multiple bf:Status not being parsed correctly in Series
- Issue with Auto-Dewey was fixed
- Multiple bf:Instances were not being reflected in the MARC review correctly
- Fixed Non-Latin Agents not building 880s correctly. Fixed the Override ability in the "Non-Latin Agents" tool feature

