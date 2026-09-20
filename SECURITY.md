# Reporting a security problem

thirukkural.xyz is a static site: the whole book is compiled into the pages,
and there is no API, no database and no application server behind it. That
removes most of what usually goes wrong, but not all of it.

If you find something — a way to get content onto the page that should not be
there, or a dependency with a known vulnerability — please open an issue at
<https://github.com/jebakumarj/thirukkural.xyz/issues>.

If the problem is sensitive enough that a public issue would put readers at
risk, write to <admin@thirukkural.xyz> instead, or use GitHub's private
vulnerability reporting on the same repository. I will respond as soon as I
can.

## What is in scope

- The application code and build scripts in this repository.
- The live site at <https://thirukkural.xyz>.

## What is not

- The correctness of the Tamil texts. Those are corrections rather than
  security problems — please open an ordinary issue.
- Reports produced by a scanner with no demonstrated impact.
