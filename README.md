# Cloudformation Explorer README
This extension aims to make your Cloudformation development easier by allowing ease-of-navigation. It also allows you to 'group' areas of your code via a name.

## Features
### Cloudformation Navigation
As long as your file begins with `AWSTemplateFormatVersion` it will be included in the explorer

### Cloudformation resoruce grouping
By using the following comment style you can group areas together (similar to C# regions)

```
### region: Nice title ###

... Cloudformation resources

### endregion

```
See the explorer in action!
![Explorer View](resources/assets/explorer.png)

See how resources can be grouped together easily
![Analyser View](resources/assets/analyser.png)

## Known Issues

Working on VSCode engine support as we speak!

## Release Notes

### 1.0.0

Initial release of cloudformation explorer.

