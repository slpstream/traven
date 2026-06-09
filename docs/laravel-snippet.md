# Laravel Anonymous Blade Components (Laravel 9+)

In modern Laravel applications (version 9 and up), Anonymous Blade Components are the most elegant way to encapsulate UI elements. You can wrap `<traven-editor>` into a reusable `<x-traven-editor>` component.

## 1. Create the Component

Create a new file at `resources/views/components/traven-editor.blade.php`. 

This component will accept a `name` attribute, forward any extra attributes (like `id` or custom classes), and safely inject the old session input or the provided slot content.

```blade
{{-- resources/views/components/traven-editor.blade.php --}}
@props(['name'])

<traven-editor name="{{ $name }}" {{ $attributes }}>
    {{ old($name, $slot) }}
</traven-editor>

{{-- Push the script to the footer stack, ensuring it only loads once --}}
@pushOnce('scripts')
    <script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@0.2.9/dist/traven.js"></script>
@endPushOnce
```

## 2. Use in your Views

Now you can use the component anywhere in your application. Because we used `@pushOnce`, you can include multiple editors on the same page and the Traven module will still only be fetched once.

```blade
{{-- resources/views/posts/edit.blade.php --}}
<x-layout>
    <form action="{{ route('posts.update', $post) }}" method="POST">
        @csrf
        @method('PUT')

        <div>
            <label for="title">Title</label>
            <input type="text" name="title" id="title" value="{{ old('title', $post->title) }}">
            @error('title') <span class="error">{{ $message }}</span> @enderror
        </div>

        <div>
            <label>Content</label>
            {{-- Render the editor component, passing the existing content as the slot --}}
            <x-traven-editor name="body" id="post-body">
                {{ $post->content }}
            </x-traven-editor>
            @error('body') <span class="error">{{ $message }}</span> @enderror
        </div>

        <button type="submit">Update Post</button>
    </form>
</x-layout>
```

*Note: Ensure your layout file (`x-layout` in the example above) contains `@stack('scripts')` just before the closing `</body>` tag so the Traven JS module can be injected.*

## 3. Handle in the Controller

The `<traven-editor>` natively synchronizes a hidden `<textarea>`, meaning standard Laravel Form Requests and validation rules work flawlessly with zero JavaScript glue:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function update(Request $request, Post $post)
    {
        // Traven submits standard form data, so native validation works perfectly
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body'  => 'required|string',
        ]);

        $post->update([
            'title'   => $validated['title'],
            'content' => $validated['body'], // The raw markdown
        ]);

        return redirect()->route('posts.show', $post)->with('success', 'Updated!');
    }
}
```
