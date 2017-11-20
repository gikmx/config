# [@gik/tools-configurator](https://github.com/gikmx/config#readme) *0.0.4*
> Imports configuration from a folder

##### Contributors
- [Héctor Menéndez](mailto:etor@gik.mx) []()

##### Supported platforms
- linux
- darwin

#### <a name="table-of-contents"></a> Table of contents
- **[configurator](#configurator)** Load data from json (compatible) files according to current environment.
  - **[Path](#configurator.Path)** Returns full paths for the directories declard con package.json
  - **[Env](#configurator.Env)** Returns the current environment.


# <a name="configurator"></a> configurator

Load data from json (compatible) files according to current environment.
when no environment is specified `development` is assumed.

As an added bonus, the contents of `Path` and `Env` will be available to you when
populating the configuration.

###### Example

Assuming the following directory structure and `process.env.NODE_ENV = 'production'`:

```
 └ etc
    ├ default.json -> {
    |    "a": {
    |        "a1": "one",
    |        "a2": "two",
    |        "aa": "${a.a1}${a.a2}"
    |    }
    | }
    └ default-production.json -> {
          "a": {
              "ab": "${a.aa}-b"
          },
          "b": "${Env}"
      }
```
The result would be:

```js
{
    a: {
        a1: 'one',
        a2: 'two',
        aa: 'onetwo',
        ab: 'onetwo-b'
    },
    b: 'development'
}
```

###### Parameters
<table>
    <tr>
        <td style="white-space: nowrap;">
            <code>[settings]</code>
        </td>
        <td style="white-space: nowrap;">
                <a href="#Object">Object</a>
        </td>
        <td>Settings to customize behaviour.</td>
    </tr><tr>
        <td style="white-space: nowrap;">
            <code>[settings.name]</code>
        </td>
        <td style="white-space: nowrap;">
                <a href="#string">string</a>
        </td>
        <td>The name for the config files. <b>Default <code>default</code></b></td>
    </tr><tr>
        <td style="white-space: nowrap;">
            <code>[settings.path]</code>
        </td>
        <td style="white-space: nowrap;">
                <a href="#string">string</a>
        </td>
        <td>The path where config files are located. <b>Default <code>Path.etc</code></b></td>
    </tr><tr>
        <td style="white-space: nowrap;">
            <code>[settings.ext]</code>
        </td>
        <td style="white-space: nowrap;">
                <a href="#string">string</a>
        </td>
        <td>The extension filter for config files. <b>Default <code>.json</code></b></td>
    </tr>
</table>


###### Returns
 [`Object`](#Object) <span style="font-weight:normal"> - The result of the merge of the common and environment file.</span>
###### Throws
- `ConfiguratorSettingsTypeError` - When sent an invalid settings parameter.
- `ConfiguratorSettingsPathError` - When settings.path cannot be found.
- `ConfiguratorFileError` - When a file cannot be loaded.
- `ConfiguratorParseError` - When an error occurs when loading a file.

###### Members

- [Path](#configurator.Path)
- [Env](#configurator.Env)

<small>**[▲ Top](#table-of-contents)**</small>

---

## <a name="configurator.Path"></a> Path

Returns full paths for the directories declard con package.json



<small>**[▲ Top](#table-of-contents)**</small>

---

## <a name="configurator.Env"></a> Env

Returns the current environment.



<small>**[▲ Top](#table-of-contents)**</small>

---

