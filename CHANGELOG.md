# Change Log - @itwin/eslint-plugin

<!-- This log was last generated on Fri, 09 May 2025 15:11:14 GMT and should not be manually modified. -->

<!-- Start content -->

## 5.2.1

Fri, 09 May 2025 15:11:14 GMT

### Patches

- Fix processing of 'no-internal' rule throwing error on default import statements (anmolshres98@users.noreply.github.com)

## 5.2.0

Wed, 07 May 2025 14:47:01 GMT

### Minor changes

- Update `no-internal` rule check to run when extending internal class, setting internal class as parameter type or variable type, passing internal class constructor as argument, and in `instanceof` expression. Additionally, report all instances at time of import. (anmolshres98@users.noreply.github.com)

## 5.1.0

Fri, 21 Mar 2025 21:30:49 GMT

### Minor changes

- Update @typescript-eslint/restrict-template-expressions to warn with future error notice (anmolshres98@users.noreply.github.com)

### Patches

- Update @typescript-eslint/restrict-template-expressions rule to warn with no options (anmolshres98@users.noreply.github.com)
- update typescript-eslint (66480813+paulius-valiunas@users.noreply.github.com)

## 5.0.0

Mon, 16 Dec 2024 22:46:33 GMT

### Major changes

- Updated to support ESLint v9 and typescript-eslint v8.11 (33036725+wgoehrig@users.noreply.github.com)

### Minor changes

- disallow non-null assertions using the `!` postfix operator (aruniverse@users.noreply.github.com)

### Changes

- Do not disable @typescript-eslint/unbound-method in ui plugin (36916096+karolis-zukauskas@users.noreply.github.com)

## 4.1.1

Thu, 18 Jul 2024 20:42:48 GMT

### Patches

- Add optional parameter for creating CSV in no-internal-summary-table-creator.js (anmolshres98@users.noreply.github.com)
- Don't create csv report by default and add JSDoc for the summary table creator function (anmolshres98@users.noreply.github.com)

## 4.1.0

Mon, 17 Jun 2024 21:01:01 GMT

### Minor changes

- Add new custom formatter for 'no-internal' rule violations that creates a summary table with report of all violations and writes the table to a csv file. (anmolshres98@users.noreply.github.com)

## 4.1.0

Mon, 17 Jun 2024 20:27:49 GMT

### Minor changes

- Add new custom formatter for 'no-internal' rule violations that creates a summary table with report of all violations and writes the table to a csv file. (anmolshres98@users.noreply.github.com)

## 4.0.2

Wed, 08 May 2024 15:56:58 GMT

### Patches

- fix csv output generation (ben-polinsky@users.noreply.github.com)

## 4.0.1

Mon, 06 May 2024 15:27:56 GMT

### Patches

- remove console.log; simplify logic a tad (ben-polinsky@users.noreply.github.com)

## 4.0.0

Wed, 10 Apr 2024 15:31:15 GMT

### Major changes

- Modify extensions rule to accept @beta tags instead of @preview tags. (ben-polinsky@users.noreply.github.com)
- Converting to using eslint flat config (Jake-Screen@users.noreply.github.com)
- Update eslint to 8.36.0 (yashincontrol@users.noreply.github.com)

### Minor changes

- Added support for TypeScript 5.0 ( 48823762+yashincontrol@users.noreply.github.com)
- Bumped plugins versions (24278440+saskliutas@users.noreply.github.com)

### Changes

- Disable some of the newer lint rules. (33036725+wgoehrig@users.noreply.github.com)

## 3.6.0
Wed, 08 Feb 2023 14:58:40 GMT

_Version update only_

## 3.5.5
Thu, 26 Jan 2023 22:53:27 GMT

_Version update only_

## 3.5.4
Wed, 18 Jan 2023 15:27:15 GMT

_Version update only_

## 3.5.3
Fri, 13 Jan 2023 17:23:07 GMT

_Version update only_

## 3.5.2
Wed, 11 Jan 2023 16:46:30 GMT

### Updates

- security fixes

## 3.5.1
Thu, 15 Dec 2022 16:38:29 GMT

_Version update only_

## 3.5.0
Wed, 07 Dec 2022 19:12:37 GMT

### Updates

- do not recommend indentation for ternary expressions
- Fix `no-internal-report`, rename eslint plugin scope from `@bentley` to `@itwin`

## 3.4.7
Wed, 30 Nov 2022 14:28:19 GMT

_Version update only_

## 3.4.6
Tue, 22 Nov 2022 14:24:19 GMT

_Version update only_

## 3.4.5
Thu, 17 Nov 2022 21:32:50 GMT

_Version update only_

## 3.4.4
Thu, 10 Nov 2022 19:32:17 GMT

_Version update only_

## 3.4.3
Fri, 28 Oct 2022 13:34:58 GMT

_Version update only_

## 3.4.2
Mon, 24 Oct 2022 13:23:45 GMT

_Version update only_

## 3.4.1
Mon, 17 Oct 2022 20:06:51 GMT

### Updates

- do not recommend indentation for ternary expressions

## 3.4.0
Thu, 13 Oct 2022 20:24:47 GMT

### Updates

- Moved React-specific rules out of itwinjs-recommended and into the ui config
- Updated Node types declaration to support latest v16
- Add max-statements-per-line with max=1.

## 3.3.5
Tue, 27 Sep 2022 11:50:59 GMT

_Version update only_

## 3.3.4
Thu, 08 Sep 2022 19:00:05 GMT

_Version update only_

## 3.3.3
Tue, 06 Sep 2022 20:54:19 GMT

_Version update only_

## 3.3.2
Thu, 01 Sep 2022 14:37:22 GMT

_Version update only_

## 3.3.1
Fri, 26 Aug 2022 15:40:02 GMT

_Version update only_

## 3.3.0
Thu, 18 Aug 2022 19:08:02 GMT

### Updates

- upgrade mocha to version 10.0.0

## 3.2.9
Fri, 26 Aug 2022 14:21:40 GMT

_Version update only_

## 3.2.8
Tue, 09 Aug 2022 15:52:41 GMT

_Version update only_

## 3.2.7
Mon, 01 Aug 2022 13:36:56 GMT

_Version update only_

## 3.2.6
Fri, 15 Jul 2022 19:04:43 GMT

_Version update only_

## 3.2.5
Wed, 13 Jul 2022 15:45:52 GMT

_Version update only_

## 3.2.4
Tue, 21 Jun 2022 18:06:33 GMT

_Version update only_

## 3.2.3
Fri, 17 Jun 2022 15:18:39 GMT

_Version update only_

## 3.2.2
Fri, 10 Jun 2022 16:11:37 GMT

_Version update only_

## 3.2.1
Tue, 07 Jun 2022 15:02:56 GMT

_Version update only_

## 3.2.0
Fri, 20 May 2022 13:10:54 GMT

### Updates

- Add extension API generation

## 3.1.3
Fri, 15 Apr 2022 13:49:25 GMT

_Version update only_

## 3.1.2
Wed, 06 Apr 2022 22:27:56 GMT

_Version update only_

## 3.1.1
Thu, 31 Mar 2022 15:55:48 GMT

_Version update only_

## 3.1.0
Tue, 29 Mar 2022 20:53:47 GMT

_Version update only_

## 3.0.3
Fri, 25 Mar 2022 15:10:02 GMT

_Version update only_

## 3.0.2
Thu, 10 Mar 2022 21:18:13 GMT

_Version update only_

## 3.0.1
Thu, 24 Feb 2022 15:26:55 GMT

_Version update only_

## 3.0.0
Mon, 24 Jan 2022 14:00:52 GMT

### Updates

- Drop support for ESLint 6.x
- rename to @itwin/eslint-plugin
- add required-barrel-modules feature
- switch to typed version of dot-notation rule
- Incorporating iTwinUI-CSS and iTwinUI-React into iModel.js

## 2.19.28
Wed, 12 Jan 2022 14:52:38 GMT

_Version update only_

## 2.19.27
Wed, 05 Jan 2022 20:07:20 GMT

_Version update only_

## 2.19.26
Wed, 08 Dec 2021 20:54:52 GMT

_Version update only_

## 2.19.25
Fri, 03 Dec 2021 20:05:49 GMT

_Version update only_

## 2.19.24
Mon, 29 Nov 2021 18:44:31 GMT

_Version update only_

## 2.19.23
Mon, 22 Nov 2021 20:41:39 GMT

_Version update only_

## 2.19.22
Wed, 17 Nov 2021 01:23:26 GMT

_Version update only_

## 2.19.21
Wed, 10 Nov 2021 10:58:24 GMT

_Version update only_

## 2.19.20
Fri, 29 Oct 2021 16:14:22 GMT

_Version update only_

## 2.19.19
Mon, 25 Oct 2021 16:16:25 GMT

_Version update only_

## 2.19.18
Thu, 21 Oct 2021 20:59:44 GMT

_Version update only_

## 2.19.17
Thu, 14 Oct 2021 21:19:43 GMT

_Version update only_

## 2.19.16
Mon, 11 Oct 2021 17:37:46 GMT

_Version update only_

## 2.19.15
Fri, 08 Oct 2021 16:44:23 GMT

_Version update only_

## 2.19.14
Fri, 01 Oct 2021 13:07:03 GMT

_Version update only_

## 2.19.13
Tue, 21 Sep 2021 21:06:40 GMT

_Version update only_

## 2.19.12
Wed, 15 Sep 2021 18:06:46 GMT

_Version update only_

## 2.19.11
Thu, 09 Sep 2021 21:04:57 GMT

_Version update only_

## 2.19.10
Wed, 08 Sep 2021 14:36:01 GMT

_Version update only_

## 2.19.9
Wed, 25 Aug 2021 15:36:01 GMT

_Version update only_

## 2.19.8
Mon, 23 Aug 2021 13:23:13 GMT

_Version update only_

## 2.19.7
Fri, 20 Aug 2021 17:47:22 GMT

_Version update only_

## 2.19.6
Tue, 17 Aug 2021 20:34:28 GMT

_Version update only_

## 2.19.5
Fri, 13 Aug 2021 21:48:08 GMT

_Version update only_

## 2.19.4
Thu, 12 Aug 2021 13:09:26 GMT

_Version update only_

## 2.19.3
Wed, 04 Aug 2021 20:29:34 GMT

_Version update only_

## 2.19.2
Tue, 03 Aug 2021 18:26:23 GMT

_Version update only_

## 2.19.1
Thu, 29 Jul 2021 20:01:11 GMT

_Version update only_

## 2.19.0
Mon, 26 Jul 2021 12:21:25 GMT

### Updates

- add and recommend no-internal-barrel-imports rule
- Whitespace changes
- enforce use of typed return-await alternative with try/catch handling

## 2.18.4
Tue, 10 Aug 2021 19:35:13 GMT

_Version update only_

## 2.18.3
Wed, 28 Jul 2021 17:16:30 GMT

_Version update only_

## 2.18.2
Mon, 26 Jul 2021 16:18:31 GMT

_Version update only_

## 2.18.1
Fri, 16 Jul 2021 17:45:09 GMT

_Version update only_

## 2.18.0
Fri, 09 Jul 2021 18:11:24 GMT

### Updates

- Typescript is now a peer-dependency

## 2.17.3
Mon, 26 Jul 2021 16:08:36 GMT

_Version update only_

## 2.17.2
Thu, 08 Jul 2021 15:23:00 GMT

_Version update only_

## 2.17.1
Fri, 02 Jul 2021 15:38:30 GMT

_Version update only_

## 2.17.0
Mon, 28 Jun 2021 16:20:11 GMT

### Updates

- Output parent symbol and skip local files in no-internal eslint rule
- Added no-internal-report command to @itwin/eslint-plugin

## 2.16.10
Thu, 22 Jul 2021 20:23:45 GMT

_Version update only_

## 2.16.9
Tue, 06 Jul 2021 22:08:34 GMT

_Version update only_

## 2.16.8
Fri, 02 Jul 2021 17:40:46 GMT

_Version update only_

## 2.16.7
Mon, 28 Jun 2021 18:13:04 GMT

_Version update only_

## 2.16.6
Mon, 28 Jun 2021 13:12:55 GMT

_Version update only_

## 2.16.5
Fri, 25 Jun 2021 16:03:01 GMT

_Version update only_

## 2.16.4
Wed, 23 Jun 2021 17:09:07 GMT

_Version update only_

## 2.16.3
Wed, 16 Jun 2021 20:29:32 GMT

_Version update only_

## 2.16.2
Thu, 03 Jun 2021 18:08:11 GMT

_Version update only_

## 2.16.1
Thu, 27 May 2021 20:04:22 GMT

_Version update only_

## 2.16.0
Mon, 24 May 2021 15:58:39 GMT

_Version update only_

## 2.15.6
Wed, 26 May 2021 15:55:18 GMT

_Version update only_

## 2.15.5
Thu, 20 May 2021 15:06:26 GMT

_Version update only_

## 2.15.4
Tue, 18 May 2021 21:59:07 GMT

_Version update only_

## 2.15.3
Mon, 17 May 2021 13:31:37 GMT

_Version update only_

## 2.15.2
Wed, 12 May 2021 18:08:13 GMT

_Version update only_

## 2.15.1
Wed, 05 May 2021 13:18:31 GMT

_Version update only_

## 2.15.0
Fri, 30 Apr 2021 12:36:58 GMT

_Version update only_

## 2.14.4
Thu, 22 Apr 2021 21:07:33 GMT

_Version update only_

## 2.14.3
Thu, 15 Apr 2021 15:13:16 GMT

_Version update only_

## 2.14.2
Thu, 08 Apr 2021 14:30:09 GMT

_Version update only_

## 2.14.1
Mon, 05 Apr 2021 16:28:00 GMT

_Version update only_

## 2.14.0
Fri, 02 Apr 2021 13:18:42 GMT

_Version update only_

## 2.13.0
Tue, 09 Mar 2021 20:28:13 GMT

### Updates

- Updated to use TypeScript 4.1

## 2.12.3
Mon, 08 Mar 2021 15:32:00 GMT

_Version update only_

## 2.12.2
Wed, 03 Mar 2021 18:48:52 GMT

_Version update only_

## 2.12.1
Tue, 23 Feb 2021 20:54:45 GMT

_Version update only_

## 2.12.0
Thu, 18 Feb 2021 22:10:12 GMT

_Version update only_

## 2.11.2
Thu, 18 Feb 2021 02:50:59 GMT

_Version update only_

## 2.11.1
Thu, 04 Feb 2021 17:22:41 GMT

_Version update only_

## 2.11.0
Thu, 28 Jan 2021 13:39:27 GMT

### Updates

- only allow 1 blank line
- add no-internal rule

## 2.10.3
Fri, 08 Jan 2021 18:34:03 GMT

_Version update only_

## 2.10.2
Fri, 08 Jan 2021 14:52:02 GMT

_Version update only_

## 2.10.1
Tue, 22 Dec 2020 00:53:38 GMT

_Version update only_

## 2.10.0
Fri, 18 Dec 2020 18:24:01 GMT

_Version update only_

## 2.9.9
Sun, 13 Dec 2020 19:00:03 GMT

_Version update only_

## 2.9.8
Fri, 11 Dec 2020 02:57:36 GMT

_Version update only_

## 2.9.7
Wed, 09 Dec 2020 20:58:23 GMT

_Version update only_

## 2.9.6
Mon, 07 Dec 2020 18:40:48 GMT

_Version update only_

## 2.9.5
Sat, 05 Dec 2020 01:55:56 GMT

_Version update only_

## 2.9.4
Wed, 02 Dec 2020 20:55:40 GMT

_Version update only_

## 2.9.3
Mon, 23 Nov 2020 20:57:56 GMT

_Version update only_

## 2.9.2
Mon, 23 Nov 2020 15:33:50 GMT

_Version update only_

## 2.9.1
Thu, 19 Nov 2020 17:03:42 GMT

_Version update only_

## 2.9.0
Wed, 18 Nov 2020 16:01:50 GMT

### Updates

- Semicolons are now required by default everywhere where they apply

## 2.8.1
Tue, 03 Nov 2020 00:33:56 GMT

_Version update only_

## 2.8.0
Fri, 23 Oct 2020 17:04:02 GMT

### Updates

- Added jsdoc ESLint rule for UI packages

## 2.7.6
Wed, 11 Nov 2020 16:28:23 GMT

_Version update only_

## 2.7.5
Fri, 23 Oct 2020 16:23:50 GMT

_Version update only_

## 2.7.4
Mon, 19 Oct 2020 17:57:01 GMT

_Version update only_

## 2.7.3
Wed, 14 Oct 2020 17:00:58 GMT

_Version update only_

## 2.7.2
Tue, 13 Oct 2020 18:20:38 GMT

_Version update only_

## 2.7.1
Thu, 08 Oct 2020 13:04:35 GMT

_Version update only_

## 2.7.0
Fri, 02 Oct 2020 18:03:32 GMT

### Updates

- Added 'jam3/no-sanitizer-with-danger' ESLint rule for UI React packages

## 2.6.5
Sat, 26 Sep 2020 16:06:34 GMT

_Version update only_

## 2.6.4
Tue, 22 Sep 2020 17:40:07 GMT

_Version update only_

## 2.6.3
Mon, 21 Sep 2020 14:47:09 GMT

_Version update only_

## 2.6.2
Mon, 21 Sep 2020 13:07:43 GMT

_Version update only_

## 2.6.1
Fri, 18 Sep 2020 13:15:08 GMT

_Version update only_

## 2.6.0
Thu, 17 Sep 2020 13:16:12 GMT

### Updates

- Moved ESLint configuration to a plugin
