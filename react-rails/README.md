[![Gem](https://img.shields.io/gem/v/react-rails.svg?style=flat-square)](http://rubygems.org/gems/react-rails)
[![Build Status](https://img.shields.io/travis/reactjs/react-rails/master.svg?style=flat-square)](https://travis-ci.org/reactjs/react-rails)
[![Gemnasium](https://img.shields.io/gemnasium/reactjs/react-rails.svg?style=flat-square)](https://gemnasium.com/reactjs/react-rails)
[![Code Climate](https://img.shields.io/codeclimate/github/reactjs/react-rails.svg?style=flat-square)](https://codeclimate.com/github/reactjs/react-rails)
[![Test Coverage](https://img.shields.io/codeclimate/coverage/github/reactjs/react-rails.svg?style=flat-square)](https://codeclimate.com/github/reactjs/react-rails/coverage)

* * *

# react-rails


`react-rails` makes it easy to use [React](http://facebook.github.io/react/) and [JSX](http://facebook.github.io/react/docs/jsx-in-depth.html) 
in your Ruby on Rails (3.2+) application. `react-rails` can:

- Provide [various `react` builds](#reactjs-builds) to your asset bundle
- Transform [`.jsx` in the asset pipeline](#jsx)
- [Render components into views and mount them](#rendering--mounting) via view helper & `react_ujs`
- [Render components server-side](#server-rendering) with `prerender: true`
- [Generate components](#component-generator) with a Rails generator

## Installation

Add `react-rails` to your gemfile:

```ruby
gem 'react-rails', '~> 1.0'
```

Next, run the installation script:

```bash
rails g react:install
```

This will:
- create a `components.js` manifest file and a `app/assets/javascripts/components/` directory, 
where you will put your components
- place the following in your `application.js`:

  ```js
  //= require react
  //= require react_ujs
  //= require components
  ```

## Usage

### React.js builds

You can pick which React.js build (development, production, with or without [add-ons]((http://facebook.github.io/react/docs/addons.html))) 
to serve in each environment by adding a config. Here are the defaults:

```ruby
# config/environments/development.rb
MyApp::Application.configure do
  config.react.variant = :development
end

# config/environments/production.rb
MyApp::Application.configure do
  config.react.variant = :production
end
```

To include add-ons, use this config:

```ruby
MyApp::Application.configure do
  config.react.addons = true # defaults to false
end
```

After restarting your Rails server, `//= require react`  will provide the build of React.js which 
was specified by the configurations.

`react-rails` offers a few other options for versions & builds of React.js. 
See [VERSIONS.md](https://github.com/reactjs/react-rails/blob/master/VERSIONS.md) for more info about
 using the `react-source` gem or dropping in your own copies of React.js.

### JSX

After installing `react-rails`, restart your server. Now, `.js.jsx` files will be transformed in the asset pipeline.

`react-rails` currently ships with two transformers, to convert jsx code -
 
* `BabelTransformer` using [Babel](http://babeljs.io), which is the default transformer.
* `JSXTransformer` using `JSXTransformer.js`

#### BabelTransformer options

You can use babel's [transformers](http://babeljs.io/docs/advanced/transformers/) and [custom plugins](http://babeljs.io/docs/advanced/plugins/), 
and pass [options](http://babeljs.io/docs/usage/options/) to the babel transpiler adding following configurations:

```ruby
config.react.jsx_transform_options = {
  blacklist: ['spec.functionName', 'validation.react'], // default options
  optional: ["transformerName"],  // pass extra babel options
  whitelist: ["useStrict"] // even more options    
}
```
Under the hood, `react-rails` users [ruby-babel-transpiler](https://github.com/babel/ruby-babel-transpiler), for transformation.
  
#### JSXTransformer options

To use old JSXTransformer you can use `React::JSX.transformer_class = React::JSX::JSXTransformer`

You can use JSX `--harmony` or `--strip-types` options by adding a configuration:

```ruby
config.react.jsx_transform_options = {
  harmony: true,
  strip_types: true, # for removing Flow type annotations
  asset_path: "path/to/JSXTransformer.js", # if your JSXTransformer is somewhere else
}
```

### Rendering & mounting

`react-rails` includes a view helper (`react_component`) and an unobtrusive JavaScript driver (`react_ujs`) 
which work together to put React components on the page. You should require the UJS driver
 in your manifest after `react` (and after `turbolinks` if you use [Turbolinks](https://github.com/rails/turbolinks)).

The __view helper__ puts a `div` on the page with the requested component class & props. For example:

```erb
<%= react_component('HelloMessage', name: 'John') %>
<!-- becomes: -->
<div data-react-class="HelloMessage" data-react-props="{&quot;name&quot;:&quot;John&quot;}"></div>
```

On page load, the __`react_ujs` driver__ will scan the page and mount components using `data-react-class` 
and `data-react-props`. Before page unload, it will unmount components (if you want to disable this behavior, 
remove `data-react-class` attribute in `componentDidMount`).

`react_ujs` uses Turbolinks events if they're available, otherwise, it uses native events.
 __Turbolinks >= 2.4.0__ is recommended because it exposes better events.

The view helper's signature is:

```ruby
react_component(component_class_name, props={}, html_options={})
```

- `component_class_name` is a string which names a globally-accessible component class. It may have dots (eg, `"MyApp.Header.MenuItem"`).
- `props` is either an object that responds to `#to_json` or an already-stringified JSON object (eg, made with Jbuilder, see note below).
- `html_options` may include:
  - `tag:` to use an element other than a `div` to embed `data-react-class` and `-props`.
  - `prerender: true` to render the component on the server.
  - `**other` Any other arguments (eg `class:`, `id:`) are passed through to [`content_tag`](http://api.rubyonrails.org/classes/ActionView/Helpers/TagHelper.html#method-i-content_tag).


### Server rendering

(This documentation is for the __`master` branch__, please check the [__`1.0.0` README__](https://github.com/reactjs/react-rails/tree/v1.0.0#server-rendering) for that API!)

To render components on the server, pass `prerender: true` to `react_component`:

```erb
<%= react_component('HelloMessage', {name: 'John'}, {prerender: true}) %>
<!-- becomes: -->
<div data-react-class="HelloMessage" data-react-props="{&quot;name&quot;:&quot;John&quot;}">
  <h1>Hello, John!</h1>
</div>
```

_(It will be also be mounted by the UJS on page load.)_

There are some requirements for this to work:

- `react-rails` must load your code. By convention it uses `components.js`, which was created 
by the install task. This file must include your components _and_ their dependencies (eg, Underscore.js).
- Your components must be accessible in the global scope. 
If you are using `.js.jsx.coffee` files then the wrapper function needs to be taken into account:

  ```coffee
  # @ is `window`:
  @Component = React.createClass
    render: ->
      `<ExampleComponent videos={this.props.videos} />`
  ```
- Your code can't reference `document`. Prerender processes don't have access to `document`, 
so jQuery and some other libs won't work in this environment :(

You can configure your pool of JS virtual machines and specify where it should load code:

```ruby
# config/environments/application.rb
# These are the defaults if you dont specify any yourself
MyApp::Application.configure do
  # Settings for the pool of renderers:
  config.react.server_renderer_pool_size  ||= 10
  config.react.server_renderer_timeout    ||= 20 # seconds
  config.react.server_renderer = React::ServerRendering::SprocketsRenderer
  config.react.server_renderer_options = {
    files: ["react.js", "components.js"], # files to load for prerendering
    replay_console: true,                 # if true, console.* will be replayed client-side
  }
end
```

### Component generator

`react-rails` ships with a Rails generator to help you get started with a simple component scaffold. 
You can run it using `rails generate react:component ComponentName`. 
The generator takes an optional list of arguments for default propTypes, 
which follow the conventions set in the [Reusable Components](http://facebook.github.io/react/docs/reusable-components.html) 
section of the React documentation.

For example:

```shell
rails generate react:component Post title:string body:string published:bool published_by:instanceOf{Person}
```

would generate the following in `app/assets/javascripts/components/post.js.jsx`:

```jsx
var Post = React.createClass({
  propTypes: {
    title: React.PropTypes.string,
    body: React.PropTypes.string,
    published: React.PropTypes.bool,
    publishedBy: React.PropTypes.instanceOf(Person)
  },

  render: function() {
    return (
      <div>
        <div>Title: {this.props.title}</div>
        <div>Body: {this.props.body}</div>
        <div>Published: {this.props.published}</div>
        <div>Published By: {this.props.published_by}</div>
      </div>
    );
  }
});
```

The generator can use the following arguments to create basic propTypes:

  * any
  * array
  * bool
  * element
  * func
  * number
  * object
  * node
  * shape
  * string

The following additional arguments have special behavior:

  * `instanceOf` takes an optional class name in the form of {className}.
  * `oneOf` behaves like an enum, and takes an optional list of strings in the form of `'name:oneOf{one,two,three}'`.
  * `oneOfType` takes an optional list of react and custom types in the form of `'model:oneOfType{string,number,OtherType}'`.

Note that the arguments for `oneOf` and `oneOfType` must be enclosed in single quotes
 to prevent your terminal from expanding them into an argument list.

### Jbuilder & react-rails

If you use Jbuilder to pass a JSON string to `react_component`, make sure your JSON is a stringified hash, 
not an array. This is not the Rails default -- you should add the root node yourself. For example:

```ruby
# BAD: returns a stringified array
json.array!(@messages) do |message|
  json.extract! message, :id, :name
  json.url message_url(message, format: :json)
end

# GOOD: returns a stringified hash
json.messages(@messages) do |message|
  json.extract! message, :id, :name
  json.url message_url(message, format: :json)
end
```

## CoffeeScript

It is possible to use JSX with CoffeeScript. To use CoffeeScript, create files with an extension `.js.jsx.coffee`. 
We also need to embed JSX code inside backticks so that CoffeeScript ignores the syntax it doesn't understand.
Here's an example:

```coffee
Component = React.createClass
  render: ->
    `<ExampleComponent videos={this.props.videos} />`
```
