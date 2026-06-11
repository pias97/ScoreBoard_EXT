Add-Type -AssemblyName System.Drawing

function Poly([double]$cx,[double]$cy,[double]$r,[double]$firstDeg,[int]$n){
  $pts = New-Object 'System.Collections.Generic.List[System.Drawing.PointF]'
  for($i=0;$i -lt $n;$i++){
    $a = ($firstDeg + 360.0/$n*$i) * [math]::PI/180.0
    $pts.Add([System.Drawing.PointF]::new([float]($cx + $r*[math]::Cos($a)),[float]($cy + $r*[math]::Sin($a))))
  }
  return $pts.ToArray()
}

function RoundRectPath([double]$x,[double]$y,[double]$w,[double]$h,[double]$r){
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r*2
  $p.AddArc([float]$x,[float]$y,[float]$d,[float]$d,180,90)
  $p.AddArc([float]($x+$w-$d),[float]$y,[float]$d,[float]$d,270,90)
  $p.AddArc([float]($x+$w-$d),[float]($y+$h-$d),[float]$d,[float]$d,0,90)
  $p.AddArc([float]$x,[float]($y+$h-$d),[float]$d,[float]$d,90,90)
  $p.CloseFigure()
  return $p
}

# ---- master 256 ----
$S = 256
$bmp = New-Object System.Drawing.Bitmap($S,$S,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$cx = 128.0; $cy = 128.0; $R = 78.0
$dark = [System.Drawing.Color]::FromArgb(255,13,13,16)     # ball pattern / bg
$white = [System.Drawing.Color]::FromArgb(255,250,250,250)
$live = [System.Drawing.Color]::FromArgb(255,248,113,113)
$border = [System.Drawing.Color]::FromArgb(255,42,42,48)

# background: rounded square with subtle vertical gradient
$bgRect = New-Object System.Drawing.RectangleF(14,14,228,228)
$bgPath = RoundRectPath 14 14 228 228 52
$grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect,([System.Drawing.Color]::FromArgb(255,27,27,32)),([System.Drawing.Color]::FromArgb(255,12,12,15)),90.0)
$g.FillPath($grad,$bgPath)
$pen = New-Object System.Drawing.Pen($border,2.0)
$g.DrawPath($pen,$bgPath)

# white ball
$ballBrush = New-Object System.Drawing.SolidBrush($white)
$g.FillEllipse($ballBrush,[float]($cx-$R),[float]($cy-$R),[float]($R*2),[float]($R*2))

$darkBrush = New-Object System.Drawing.SolidBrush($dark)
$seamPen = New-Object System.Drawing.Pen($dark,6.0)
$seamPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$seamPen.EndCap   = [System.Drawing.Drawing2D.LineCap]::Round

$rp = 26.0; $ro = 58.0; $rps = 15.0
# central pentagon (point up)
$central = Poly $cx $cy $rp -90 5
$g.FillPolygon($darkBrush,$central)

for($i=0;$i -lt 5;$i++){
  $angDeg = -90 + 72*$i
  $ang = $angDeg*[math]::PI/180.0
  # seam from central vertex outward
  $x1 = $cx + $rp*[math]::Cos($ang); $y1 = $cy + $rp*[math]::Sin($ang)
  $x2 = $cx + ($ro-$rps)*[math]::Cos($ang); $y2 = $cy + ($ro-$rps)*[math]::Sin($ang)
  $g.DrawLine($seamPen,[float]$x1,[float]$y1,[float]$x2,[float]$y2)
  # outer pentagon, vertex pointing inward
  $ocx = $cx + $ro*[math]::Cos($ang); $ocy = $cy + $ro*[math]::Sin($ang)
  $outer = Poly $ocx $ocy $rps ($angDeg+180) 5
  $g.FillPolygon($darkBrush,$outer)
}

# red live dot top-right (with dark separator ring)
$g.FillEllipse($darkBrush,[float](196-25),[float](60-25),50,50)
$liveBrush = New-Object System.Drawing.SolidBrush($live)
$g.FillEllipse($liveBrush,[float](196-17),[float](60-17),34,34)

$g.Dispose()

# ---- downscale + save ----
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
foreach($sz in 16,48,128){
  $out = New-Object System.Drawing.Bitmap($sz,$sz,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $og = [System.Drawing.Graphics]::FromImage($out)
  $og.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $og.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $og.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $og.DrawImage($bmp,(New-Object System.Drawing.Rectangle(0,0,$sz,$sz)))
  $og.Dispose()
  $path = Join-Path $dir ("icon{0}.png" -f $sz)
  $out.Save($path,[System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
  Write-Output ("wrote {0}" -f $path)
}
$bmp.Dispose()
