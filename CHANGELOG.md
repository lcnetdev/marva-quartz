# Changelog

All notable changes to this project will be documented in this file.


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

