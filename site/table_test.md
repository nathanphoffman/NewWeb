<!-- themes: cats -->
# Table CSS Test

## Basic table

| Name  | Role      | Active |
| ----- | --------- | ------ |
| Alice | Engineer  | Yes    |
| Bob   | Designer  | No     |
| Carol | Manager   | Yes    |

## Column alignment

| Left | Center | Right |
| :--- | :----: | ----: |
| a    | b      | c     |
| aaaa | bbbb   | cccc  |
| 1    | 22     | 333   |

## Cell formatting

| Item          | Price   | Link                          |
| ------------- | ------- | ----------------------------- |
| **Widget**    | `$5.00` | [buy](https://example.com)    |
| *Gadget*      | `$12.50`| [buy](https://example.com)    |
| ~~Discontinued~~ | `$0.00` | n/a                         |

## Wide table (tests horizontal scroll)

| Col 1 | Col 2 | Col 3 | Col 4 | Col 5 | Col 6 | Col 7 | Col 8 | Col 9 | Col 10 |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ------ |
| a     | b     | c     | d     | e     | f     | g     | h     | i     | j      |
| aa    | bb    | cc    | dd    | ee    | ff    | gg    | hh    | ii    | jj     |

## Unbreakable content (tests overflow scroll, not page-wide squish)

| Short | Long unbreakable value |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| a     | https://example.com/a/very/long/unbreakable/url/that/should/force/this/table/to/scroll/instead/of/squishing/every/column/down/to/nothing/at/all/1234567890 |
| b     | another-unbreakably-long-token-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890-1234567890 |

## Many rows (tests zebra striping)

| # | Value |
| - | ----- |
| 1 | one   |
| 2 | two   |
| 3 | three |
| 4 | four  |
| 5 | five  |
| 6 | six   |
