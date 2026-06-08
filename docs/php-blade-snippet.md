# Laravel Blade Directives (Legacy / Custom)

If your project prefers registering custom Blade directives (common in Laravel 8 and below, or for highly specialized rendering pipelines), you can create a `@travenEditor` and `@travenScripts` pair.

## 1. Register the Directives

In your `AppServiceProvider` or a dedicated `BladeServiceProvider`:

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Blade;

class AppServiceProvider extends ServiceProvider
{
    public function boot()
    {
        // @travenEditor('name', 'initial markdown')
        Blade::directive('travenEditor', function ($expression) {
            // Parse arguments. e.g. 'body', $post->content
            return "<?php list(\$name, \$content) = [$expression]; ?>
                <traven-editor name=\"<?php echo \$name; ?>\">
                    <?php echo e(\$content); ?>
                </traven-editor>";
        });

        // @travenScripts
        Blade::directive('travenScripts', function () {
            return '<script type="module" src="https://cdn.jsdelivr.net/gh/slpstream/traven@v0.2.7/dist/traven.js"></script>';
        });
    }
}
```

## 2. Use in your Views

You can now drop these directly into any form, such as inside an `x-blog-post-form` component or a standard Blade view:

```blade
<form action="{{ route('posts.store') }}" method="POST">
    @csrf

    <label for="title">Post Title</label>
    <input type="text" name="title" id="title" value="{{ old('title', $post->title ?? '') }}">

    <label>Body Content</label>
    <!-- Renders the Traven editor, safely escaping the markdown -->
    @travenEditor('body', old('body', $post->content ?? ''))

    <button type="submit">Save Post</button>
</form>

<!-- At the bottom of your layout or page -->
@travenScripts
```

## 3. Handle in the Controller

Because the custom element implements an internal `<textarea>`, you do not need any JSON or JavaScript payloads. You can retrieve and validate it just like a regular text field:

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Post;

class PostController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|max:255',
            'body'  => 'required|string'
        ]);

        // The markdown body is natively available
        Post::create([
            'title'   => $validated['title'],
            'content' => $validated['body'], // Contains the raw Markdown
        ]);

        return redirect()->route('posts.index')->with('success', 'Post saved!');
    }
}
```
