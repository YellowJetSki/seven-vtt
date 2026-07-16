set fso = CreateObject("Scripting.FileSystemObject")
src = "C:\Users\mikej\OneDrive\Documents\apps\pedal-sheet\public"

Function CopyFiles(sFolder, dFolder, pattern)
    For Each f In fso.GetFolder(sFolder).Files
        If LCase(fso.GetExtensionName(f.Name)) = "png" And InStr(f.Name, pattern) > 0 Then
            If Not fso.FolderExists(dFolder) Then fso.CreateFolder(dFolder)
            fso.CopyFile f.Path, dFolder & "\" & f.Name, True
            WScript.Echo "OK: " & f.Name & " -> " & dFolder
        End If
    Next
End Function

' Battlemaps (_enc.png)
CopyFiles src, "vtt\public\images\battlemaps", "_enc.png"

' Tokens (_bm.png)
CopyFiles src, "vtt\public\images\tokens", "_bm.png"

' Portraits (specific names)
For Each f In fso.GetFolder(src).Files
    If LCase(fso.GetExtensionName(f.Name)) = "png" Then
        n = LCase(fso.GetBaseName(f.Name))
        If n = "kehrfuffle" Or n = "strider" Or n = "toern" Or n = "wendy" Then
            fso.CopyFile f.Path, "vtt\public\images\portraits\" & f.Name, True
            WScript.Echo "OK: " & f.Name & " -> portraits"
        End If
    End If
Next

' Items (everything else except icon, t_pin)
For Each f In fso.GetFolder(src).Files
    If LCase(fso.GetExtensionName(f.Name)) = "png" Then
        n = LCase(fso.GetBaseName(f.Name))
        If n <> "icon" And n <> "t_pin" And n <> "vite" And InStr(f.Name, "_enc.png") = 0 And InStr(f.Name, "_bm.png") = 0 And n <> "kehrfuffle" And n <> "strider" And n <> "toern" And n <> "wendy" Then
            If Not fso.FolderExists("vtt\public\images\items") Then fso.CreateFolder("vtt\public\images\items")
            fso.CopyFile f.Path, "vtt\public\images\items\" & f.Name, True
            WScript.Echo "OK: " & f.Name & " -> items"
        End If
    End If
Next

WScript.Echo vbCrLf & "Done!"
