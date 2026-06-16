# Django Custom Template Tags

For Django applications, you can create a custom template tag to easily mount the Traven editor inside your forms, seamlessly integrating with Django's `ModelForm` workflows.

## 1. Create the Template Tag

Inside your Django app (e.g., `blog`), create a `templatetags` directory with an `__init__.py` and a `traven_tags.py` file:

```python
# blog/templatetags/traven_tags.py
from django import template
from django.utils.html import escape

register = template.Library()

@register.inclusion_tag('traven/editor.html')
def traven_editor(name="body", content=""):
    """
    Usage: {% traven_editor name="body" content=form.body.value|default:"" %}
    """
    return {
        'name': name,
        'content': content
    }
```

And create the small inclusion template `traven/editor.html` in your templates directory:

```html
<!-- templates/traven/editor.html -->
<traven-editor name="{{ name }}">
    {{ content|escape }}
</traven-editor>
```

## 2. Use in your Templates

Load the tags and use them alongside a standard `ModelForm`:

```html
{% extends 'base.html' %}
{% load traven_tags %}

{% block content %}
<form method="POST" action="{% url 'post_create' %}">
    {% csrf_token %}
    
    <!-- Render non-markdown fields normally -->
    {{ form.title.label_tag }}
    {{ form.title }}

    <!-- Render the Traven editor for the body field -->
    <label for="id_body">Body Content:</label>
    {% traven_editor name="body" content=form.body.value|default:"" %}

    <button type="submit">Save Post</button>
</form>
{% endblock %}

{% block scripts %}
<!-- Load the Traven bundle once per page -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@freedomware/traven@0.2.12/dist/traven.js"></script>
{% endblock %}
```

## 3. Handle in the View

Because Traven synchronizes a hidden `<textarea>`, Django's standard form binding works out of the box. The markdown string cleanly arrives in `cleaned_data` when the form is submitted.

```python
# blog/views.py
from django.shortcuts import render, redirect
from .forms import PostForm

def post_create(request):
    if request.method == 'POST':
        form = PostForm(request.POST)
        if form.is_valid():
            # form.cleaned_data['body'] contains the raw Markdown from Traven
            post = form.save()
            return redirect('post_detail', pk=post.pk)
    else:
        form = PostForm()
        
    return render(request, 'blog/post_form.html', {'form': form})
```
